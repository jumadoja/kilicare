from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class PassportProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='passport')
    # ONGEZA HII: Field ya picha ya mtumiaji
    image = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    
    trust_score = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

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

    def add_points(self, points):
        self.points += points
        # Tunatumia self.user.badges kwa sababu ya related_name kwenye UserBadge
        self.trust_score = self.points + (self.user.badges.count() * 10)
        self.update_level()
        self.save()

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

class PassportActivity(models.Model):
    ACTION_CHOICES = [
        ('TIP_CREATED', 'Tip Created'),
        ('TIP_UPVOTED', 'Tip Upvoted'),
        ('CHAT_HELPFUL', 'Chat Helpful'),
        ('VERIFIED_LOCAL', 'Verified Local'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passport_activities')
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    points_awarded = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)  # tip_id, chat_id etc
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action_type} ({self.points_awarded})"