from django.db import models
from django.conf import settings
from django.utils import timezone


class Tip(models.Model):

    CATEGORY_CHOICES = [
        ("LIFESTYLE", "Lifestyle"),
        ("SAFETY", "Safety"),
        ("FOOD", "Food"),
        ("CULTURE", "Culture"),
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

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tips"
    )

    upvotes = models.PositiveIntegerField(default=0)

    is_public = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} ({self.category})"
