from django.db import models
from django.conf import settings
from django.utils import timezone


class Tip(models.Model):

    CATEGORY_CHOICES = [
        ("SAFETY", "Safety"),
        ("LIFESTYLE", "Lifestyle"),
        ("NAVIGATION", "Navigation"),
        ("EXPERIENCE", "Experience"),
        ("ACCESSIBILITY", "Accessibility"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES
    )

    sub_topics = models.JSONField(
        help_text="List of sub topics e.g ['scams', 'night safety']"
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    location_address = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tips"
    )

    # Trust and ranking system
    trust_score = models.IntegerField(default=0, help_text="Calculated from creator's trust score and tip engagement")
    upvotes = models.PositiveIntegerField(default=0)
    downvotes = models.PositiveIntegerField(default=0)
    reports = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False, help_text="Verified by admins or trusted locals")

    # Visibility and moderation
    is_public = models.BooleanField(default=True)
    is_hidden = models.BooleanField(default=False, help_text="Hidden due to reports or moderation")
    featured_until = models.DateTimeField(null=True, blank=True, help_text="Featured tips get priority")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-trust_score', '-created_at']
        indexes = [
            models.Index(fields=['category', '-trust_score']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['is_public', 'is_hidden']),
            models.Index(fields=['trust_score'], name='idx_tip_trust'),
            models.Index(fields=['upvotes'], name='idx_tip_upvotes'),
            models.Index(fields=['created_at'], name='idx_tip_created'),
        ]

    def __str__(self):
        return f"{self.title} ({self.category})"

    def calculate_trust_score(self):
        """Calculate trust score based on creator's trust and engagement"""
        creator_trust = 0
        if hasattr(self.created_by, 'passport'):
            creator_trust = self.created_by.passport.trust_score
        
        # Base score from creator trust (30% weight)
        base_score = creator_trust * 0.3
        
        # Engagement score (50% weight)
        engagement_score = (self.upvotes - self.downvotes) * 2
        
        # Verification bonus (20% weight)
        verification_bonus = 50 if self.is_verified else 0
        
        # Report penalty
        report_penalty = self.reports * 10
        
        total_score = base_score + engagement_score + verification_bonus - report_penalty
        self.trust_score = max(0, int(total_score))
        self.save(update_fields=['trust_score'])
        return self.trust_score

class TipUpvote(models.Model):
    """Track individual upvotes for tips"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_upvotes"
    )
    tip = models.ForeignKey(Tip, on_delete=models.CASCADE, related_name="upvote_records")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tip')
        indexes = [
            models.Index(fields=['tip', '-created_at']),
        ]

class TipReport(models.Model):
    """Track reports for tip moderation"""
    REASON_CHOICES = [
        ('INACCURATE', 'Inaccurate Information'),
        ('SPAM', 'Spam'),
        ('INAPPROPRIATE', 'Inappropriate Content'),
        ('DUPLICATE', 'Duplicate'),
        ('OUTDATED', 'Outdated'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tip_reports"
    )
    tip = models.ForeignKey(Tip, on_delete=models.CASCADE, related_name="report_records")
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tip')
        indexes = [
            models.Index(fields=['tip', '-created_at']),
            models.Index(fields=['is_resolved', '-created_at']),
        ]
