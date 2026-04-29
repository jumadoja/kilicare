from django.db import models
from django.utils import timezone
from apps.users.models import User

class LocalExperience(models.Model):
    CATEGORY_CHOICES = (
        ('Safari', 'Safari'),
        ('Local Food', 'Local Food'),
        ('Culture', 'Culture'),
        ('Night Life', 'Night Life'),
    )

    local = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Culture')
    cultural_moment = models.TextField(blank=True, null=True)
    availability = models.CharField(max_length=255, blank=True, null=True)
    price_range = models.CharField(max_length=255, blank=True, null=True)
    today_moment_text = models.TextField(blank=True, null=True)
    today_moment_active = models.BooleanField(default=False)
    today_moment_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.category})"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['local', '-created_at']),
            models.Index(fields=['category']),
            models.Index(fields=['today_moment_active']),
            models.Index(fields=['created_at']),
        ]

def experience_media_path(instance, filename):
    # Inatenganisha folda za video na picha kulingana na ID ya experience
    if instance.media_type == 'video':
        return f"experiences/videos/{instance.experience.id}/{filename}"
    return f"experiences/images/{instance.experience.id}/{filename}"

class ExperienceMedia(models.Model):
    MEDIA_TYPE_CHOICES = (('image', 'Image'), ('video', 'Video'))
    experience = models.ForeignKey(LocalExperience, related_name='media_files', on_delete=models.CASCADE)
    file = models.FileField(upload_to=experience_media_path)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.media_type} - {self.experience.title}"