from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('TOURIST', 'Tourist'),
        ('LOCAL_GUIDE', 'Local Guide'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='TOURIST')
    is_verified = models.BooleanField(default=False)  # Only for Local
    is_online = models.BooleanField(default=False)  # Track online status
    
    # Account security fields
    failed_login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['is_locked']),
        ]
    
    def increment_failed_login(self):
        """Increment failed login counter and lock if threshold reached."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.is_locked = True
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save()
    
    def reset_failed_login(self):
        """Reset failed login counter on successful login."""
        self.failed_login_attempts = 0
        self.is_locked = False
        self.locked_until = None
        self.save()
    
    def is_account_locked(self):
        """Check if account is currently locked."""
        if not self.is_locked:
            return False
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        # Lock expired, auto-unlock
        self.is_locked = False
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save()
        return False

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

class UserSession(models.Model):
    """Track active user sessions for security and session management."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    device_name = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-created_at']
    
    def is_valid(self):
        """Check if session is still valid and not expired."""
        if not self.is_active:
            return False
        if timezone.now() > self.expires_at:
            self.is_active = False
            self.save()
            return False
        return True
    
    def refresh_activity(self):
        """Update last activity timestamp."""
        self.last_activity = timezone.now()
        self.save()

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