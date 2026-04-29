from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

User = settings.AUTH_USER_MODEL

class PassportProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passport', db_index=True)
    # ONGEZA HII: Field ya picha ya mtumiaji
    image = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    
    trust_score = models.IntegerField(default=0, db_index=True)
    points = models.IntegerField(default=0, db_index=True)
    level = models.IntegerField(default=1, db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['user'], name='idx_passport_user'),
            models.Index(fields=['trust_score'], name='idx_passport_trust'),
            models.Index(fields=['points'], name='idx_passport_points'),
            models.Index(fields=['level'], name='idx_passport_level'),
            models.Index(fields=['created_at'], name='idx_passport_created'),
        ]

    def __str__(self):
        return f"{self.user.username} Passport"

    def update_level(self):
        if self.points >= 300:
            self.level = 4
        elif self.points >= 150:
            self.level = 3
        elif self.points >= 50:
            self.level = 2
        else:
            self.level = 1
        self.save()

    def add_points(self, points, transaction_type='GENERAL', description='', metadata=None):
        """Add points to user's passport and create transaction record"""
        if points <= 0:
            return
        
        from django.db import transaction
        
        with transaction.atomic():
            # Update points
            self.points += points
            
            # Create transaction record
            PointsTransaction.objects.create(
                user=self.user,
                transaction_type=transaction_type,
                points_change=points,
                balance_after=self.points,
                description=description,
                metadata=metadata or {}
            )
            
            # Update trust score and level
            self.trust_score = self.points + (self.user.badges.count() * 10)
            self.update_level()
            self.save()

    def remove_points(self, points, transaction_type='PENALTY', description='', metadata=None):
        """Remove points from user's passport (for penalties)"""
        if points <= 0:
            return
        
        # Don't go below zero
        points_to_remove = min(points, self.points)
        
        # Update points
        self.points -= points_to_remove
        
        # Create transaction record
        PointsTransaction.objects.create(
            user=self.user,
            transaction_type=transaction_type,
            points_change=-points_to_remove,
            balance_after=self.points,
            description=description,
            metadata=metadata or {}
        )
        
        # Update trust score and level
        self.trust_score = max(0, self.points + (self.user.badges.count() * 10))
        self.update_level()
        self.save()

    def update_trust_score(self):
        """Recalculate trust score based on various factors"""
        from django.db.models import Count, Sum, Avg
        from django.utils import timezone
        import datetime
        
        base_score = 0
        
        # 1. Points contribution (50% weight)
        points_contribution = self.points * 0.5
        
        # 2. Badge contribution (20% weight)
        badge_contribution = self.user.badges.count() * 10 * 0.2
        
        # 3. Activity quality (20% weight) - optimized with aggregation
        activity_stats = PassportActivity.objects.filter(
            user=self.user,
            created_at__gte=timezone.now() - datetime.timedelta(days=30)
        ).aggregate(
            tip_created=Count('id', filter=Q(action_type='TIP_CREATED')),
            chat_helpful=Count('id', filter=Q(action_type='CHAT_HELPFUL')),
            verified_local=Count('id', filter=Q(action_type='VERIFIED_LOCAL')),
            post_moment=Count('id', filter=Q(action_type='POST_MOMENT')),
            send_message=Count('id', filter=Q(action_type='SEND_MESSAGE')),
            sos_response=Count('id', filter=Q(action_type='SOS_RESPONSE'))
        )
        
        activity_score = (
            activity_stats['tip_created'] * 10 +
            activity_stats['chat_helpful'] * 10 +
            activity_stats['verified_local'] * 10 +
            activity_stats['post_moment'] * 5 +
            activity_stats['send_message'] * 5 +
            activity_stats['sos_response'] * 20
        )
        
        activity_contribution = min(activity_score * 0.2, 50)
        
        # 4. Account age (10% weight)
        days_since_creation = (timezone.now() - self.created_at).days
        age_contribution = min(days_since_creation * 0.1, 20)
        
        # Calculate final trust score
        new_trust_score = int(
            points_contribution + 
            badge_contribution + 
            activity_contribution + 
            age_contribution
        )
        
        # Ensure trust score doesn't go below 0
        self.trust_score = max(0, new_trust_score)
        self.save(update_fields=['trust_score'])

    def get_level_info(self):
        """Get level information"""
        levels = {
            1: {'name': 'Newcomer', 'color': '#6B7280', 'min_points': 0},
            2: {'name': 'Explorer', 'color': '#10B981', 'min_points': 50},
            3: {'name': 'Adventurer', 'color': '#3B82F6', 'min_points': 150},
            4: {'name': 'Expert', 'color': '#8B5CF6', 'min_points': 300},
        }
        return levels.get(self.level, levels[1])

    def get_statistics(self):
        """Get comprehensive user statistics"""
        from django.db.models import Count, Sum
        try:
            from tips.models import Tip
            from kilicaremoments.models import KilicareMoment
            from messaging.models import Message
            
            stats = {
                'total_tips': Tip.objects.filter(created_by=self.user).count(),
                'total_moments': KilicareMoment.objects.filter(posted_by=self.user).count(),
                'total_messages': Message.objects.filter(sender=self.user).count(),
                'total_helpful_actions': PassportActivity.objects.filter(
                    user=self.user,
                    action_type__in=['TIP_CREATED', 'CHAT_HELPFUL', 'SOS_RESPONSE', 'VERIFIED_LOCAL']
                ).count(),
                'points_earned': PointsTransaction.objects.filter(
                    user=self.user,
                    points_change__gt=0
                ).aggregate(total=Sum('points_change'))['total'] or 0,
                'points_spent': abs(PointsTransaction.objects.filter(
                    user=self.user,
                    points_change__lt=0
                ).aggregate(total=Sum('points_change'))['total'] or 0),
            }
            
            # Calculate response rate
            total_interactions = stats['total_tips'] + stats['total_moments'] + stats['total_messages']
            if total_interactions > 0:
                stats['response_rate'] = int((stats['total_helpful_actions'] / total_interactions) * 100)
            else:
                stats['response_rate'] = 0
            
            return stats
        except ImportError:
            # Return basic stats if models aren't available
            return {
                'total_tips': 0,
                'total_moments': 0,
                'total_messages': 0,
                'total_helpful_actions': 0,
                'points_earned': self.points,
                'points_spent': 0,
                'response_rate': 0,
            }

class PassportBadge(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField()
    icon = models.ImageField(upload_to='passport_badges/', null=True, blank=True)
    criteria_points = models.IntegerField(default=0)  # minimum points to unlock

    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(PassportBadge, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"

class PointsTransaction(models.Model):
    """
    Track all point changes for transparency and audit
    """
    TRANSACTION_TYPES = [
        ('VISIT', 'Visit Location'),
        ('POST_MOMENT', 'Post Moment'),
        ('SEND_MESSAGE', 'Send Message'),
        ('HELPFUL_TIP', 'Helpful Tip'),
        ('REPORT', 'Report Content'),
        ('VERIFICATION', 'Account Verification'),
        ('EXPERIENCE_CREATED', 'Experience Created'),
        ('SOS_RESPONSE', 'SOS Response'),
        ('ADMIN_ADJUSTMENT', 'Admin Adjustment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_transactions')
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPES)
    points_change = models.IntegerField(help_text="Positive for gains, negative for losses")
    balance_after = models.IntegerField(help_text="User's balance after this transaction")
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)  # Related object IDs
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username}: {self.points_change:+d} ({self.transaction_type})"

class PassportActivity(models.Model):
    ACTION_CHOICES = [
        ('TIP_CREATED', 'Tip Created'),
        ('TIP_UPVOTED', 'Tip Upvoted'),
        ('CHAT_HELPFUL', 'Chat Helpful'),
        ('VERIFIED_LOCAL', 'Verified Local'),
        ('MOMENT_LIKED', 'Moment Liked'),
        ('EXPERIENCE_BOOKED', 'Experience Booked'),
        ('SOS_RESOLVED', 'SOS Resolved'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passport_activities')
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    points_awarded = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)  # tip_id, chat_id etc
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action_type} ({self.points_awarded})"