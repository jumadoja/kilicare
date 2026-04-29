import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class UserAIPreference(models.Model):
    """
    Inatunza mapendeleo ya mtumiaji:
    - Lugha
    - Sauti
    - Interests (kwa personalization & recommendations)
    """
    VOICE_CHOICES = (("male", "Kiume"), ("female", "Kike"))
    LANG_CHOICES = (("sw", "Kiswahili"), ("en", "English"))

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_prefs"
    )

    preferred_voice = models.CharField(max_length=10, choices=VOICE_CHOICES, default="female")
    preferred_language = models.CharField(max_length=5, choices=LANG_CHOICES, default="sw")

    # Mfano: ["mshikaki", "nature", "safari"]
    interests = models.JSONField(default=list, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AI Prefs: {self.user.username}"


class AIThread(models.Model):
    """
    Inawakilisha mazungumzo (conversation/session).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_threads"
    )

    title = models.CharField(max_length=255, default="Mazungumzo Mapya")

    # Memory compression
    summary = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class AIActivity(models.Model):
    """
    Inatunza kila message ndani ya thread.
    Imerekebishwa image_url kuwa TextField ili kuzuia StringDataRightTruncation error.
    """
    ROLE_CHOICES = (
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    )

    thread = models.ForeignKey(
        AIThread,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    # Content tayari ni TextField, hivyo haina shida
    content = models.TextField(null=True, blank=True)

    # MUHIMU: Imebadilishwa kuwa TextField kumeza Base64 data ndefu
    image_url = models.TextField(null=True, blank=True)

    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=["thread", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.role} - {self.thread.id}"


class ProactiveAlert(models.Model):
    """
    Alerts zinazotumwa na AI bila user kuomba.
    """
    ALERT_TYPES = (
        ("weather", "Weather"),
        ("event", "Event"),
        ("security", "Security"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_alerts"
    )

    message = models.TextField()

    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)

    is_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.alert_type}"