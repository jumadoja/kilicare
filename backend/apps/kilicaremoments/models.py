from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# =========================
# FOLLOW SYSTEM
# =========================
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

# =========================
# CORE MOMENT
# =========================
class KilicareMoment(models.Model):
    MEDIA_TYPE = (
        ('image', 'Image'),
        ('video', 'Video'),
    )

    VISIBILITY_CHOICES = (
        ('PUBLIC', 'Public'),
        ('FOLLOWERS', 'Followers Only'),
        ('PRIVATE', 'Private'),
    )

    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moments')
    media = models.FileField(upload_to='moments/', help_text="Will be migrated to cloud storage")
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE)
    caption = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Engagement metrics
    views = models.PositiveIntegerField(default=0)
    shares = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False, help_text="Featured moments get priority in feed")
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='PUBLIC')
    
    # Content moderation
    is_hidden = models.BooleanField(default=False, help_text="Hidden due to reports or moderation")
    content_warning = models.CharField(max_length=50, blank=True, help_text="e.g., violence, adult content")
    
    # Trending algorithm support
    trending_score = models.FloatField(default=0.0, help_text="Calculated for trending algorithm")
    last_engagement = models.DateTimeField(auto_now=True, help_text="Updated on any engagement")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-trending_score', '-created_at']
        indexes = [
            models.Index(fields=['posted_by', '-created_at']),
            models.Index(fields=['-trending_score', '-created_at']),
            models.Index(fields=['visibility', 'is_hidden']),
            models.Index(fields=['is_featured', '-created_at']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def calculate_trending_score(self):
        """Calculate trending score based on recent engagement"""
        import datetime
        from django.utils import timezone
        
        # Time decay factor (newer content gets higher score)
        hours_since_creation = (timezone.now() - self.created_at).total_seconds() / 3600
        time_decay = max(0.1, 1.0 / (1.0 + hours_since_creation * 0.01))
        
        # Engagement score
        engagement_score = (
            self.likes.count() * 3 +  # Likes weighted higher
            self.comments.count() * 2 +  # Comments weighted medium
            self.shares * 5 +  # Shares weighted highest
            self.views * 0.1  # Views weighted lowest
        )
        
        # Creator trust bonus
        creator_bonus = 1.0
        if hasattr(self.posted_by, 'passport'):
            creator_trust = self.posted_by.passport.trust_score
            creator_bonus = 1.0 + (creator_trust / 1000)  # Scale trust score
        
        # Final trending score
        self.trending_score = engagement_score * time_decay * creator_bonus
        self.save(update_fields=['trending_score'])
        return self.trending_score

# =========================
# LIKE
# =========================
class MomentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    moment = models.ForeignKey(KilicareMoment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'moment')

# =========================
# COMMENT
# =========================
class MomentComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    moment = models.ForeignKey(KilicareMoment, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# =========================
# SAVE MOMENT
# =========================
class SavedMoment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    moment = models.ForeignKey(KilicareMoment, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'moment')

# =========================
# BACKGROUND MUSIC
# =========================
class BackgroundMusic(models.Model):
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to='music/')
    description = models.TextField(blank=True)

# =========================
# ADMIN LOGS
# =========================
class AdminActionLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    target_user = models.ForeignKey(User, null=True, blank=True, related_name='log_target_user', on_delete=models.SET_NULL)
    target_moment = models.ForeignKey(KilicareMoment, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
