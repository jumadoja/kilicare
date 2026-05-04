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
        print("USER MODEL STEP 1: increment_failed_login called")
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.is_locked = True
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        print("USER MODEL STEP 2: Before save in increment_failed_login")
        self.save()
        print("USER MODEL STEP 3: After save in increment_failed_login")
    
    def reset_failed_login(self):
        """Reset failed login counter on successful login."""
        print("USER MODEL STEP 4: reset_failed_login called")
        self.failed_login_attempts = 0
        self.is_locked = False
        self.locked_until = None
        print("USER MODEL STEP 5: Before save in reset_failed_login")
        self.save()
        print("USER MODEL STEP 6: After save in reset_failed_login")
    
    def is_account_locked(self):
        """Check if account is currently locked."""
        print("USER MODEL STEP 7: is_account_locked called")
        if not self.is_locked:
            print("USER MODEL STEP 8: Account not locked, returning False")
            return False
        if self.locked_until and timezone.now() < self.locked_until:
            print("USER MODEL STEP 9: Account still locked, returning True")
            return True
        # Lock expired, auto-unlock
        print("USER MODEL STEP 10: Lock expired, auto-unlocking")
        self.is_locked = False
        self.locked_until = None
        self.failed_login_attempts = 0
        print("USER MODEL STEP 11: Before save in is_account_locked")
        self.save()
        print("USER MODEL STEP 12: After save in is_account_locked")
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