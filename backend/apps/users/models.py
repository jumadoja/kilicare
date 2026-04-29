from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random

class User(AbstractUser):
    ROLE_CHOICES = (
        ('TOURIST', 'Tourist'),
        ('LOCAL_GUIDE', 'Local Guide'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='TOURIST')
    is_verified = models.BooleanField(default=False)  # Only for Local
    
    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    gender = models.CharField(max_length=10, choices=(('MALE','Male'),('FEMALE','Female')), blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)

class UserActivity(models.Model):
    ACTION_CHOICES = (
        ('LOGIN','Login'),
        ('REGISTER','Register'),
        ('CREATE','Create'),
        ('UPDATE','Update'),
    ) 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=255)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

# OTP Model
class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_otps")
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.otp:
            self.otp = f"{random.randint(100000, 999999)}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at