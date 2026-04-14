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

    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    media = models.FileField(upload_to='moments/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE)
    caption = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

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
