from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class SOSAlert(models.Model):
    """
    SOS Alert model for emergency situations
    """
    SEVERITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )
    
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('RESPONDING', 'Responding'),
        ('RESOLVED', 'Resolved'),
        ('CANCELLED', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sos_alerts')
    
    # Location data
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    location_address = models.CharField(max_length=255, blank=True)
    
    # Alert details
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='HIGH')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    message = models.TextField(blank=True, help_text="Additional context about the emergency")
    
    # Response tracking
    responders = models.ManyToManyField(
        User, 
        related_name='responded_alerts', 
        blank=True,
        help_text="Locals/admins who responded to this alert"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['severity']),
            models.Index(fields=['created_at']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"SOS Alert by {self.user.username} ({self.severity})"

    def resolve(self):
        """Mark alert as resolved"""
        self.status = 'RESOLVED'
        self.resolved_at = timezone.now()
        self.save()

class SOSResponse(models.Model):
    """
    Individual responses to SOS alerts
    """
    alert = models.ForeignKey(SOSAlert, on_delete=models.CASCADE, related_name='responses')
    responder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sos_responses')
    
    message = models.TextField(blank=True)
    is_onsite = models.BooleanField(default=False, help_text="Is responder physically onsite?")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['alert', '-created_at']),
            models.Index(fields=['responder', '-created_at']),
            models.Index(fields=['created_at']),
        ]
        unique_together = ('alert', 'responder')

    def __str__(self):
        return f"Response by {self.responder.username} to Alert #{self.alert.id}"
