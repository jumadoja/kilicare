from django.contrib.auth import get_user_model
from django.db import transaction
from .base_service import BaseService
from ..exceptions import (
    ValidationError,
    NotFoundError,
    AuthenticationError,
)

User = get_user_model()


class RegisterUserService(BaseService):
    """Service for user registration"""
    
    def execute(self, username, email, password, role, profile_data=None):
        """
        Register a new user with profile
        """
        # Validate input
        if not username or not email or not password:
            raise ValidationError("Username, email, and password are required")
        
        if role not in ['TOURIST', 'LOCAL_GUIDE']:
            raise ValidationError("Invalid role. Must be TOURIST or LOCAL_GUIDE")
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            raise ValidationError("Username already exists")
        
        if User.objects.filter(email=email).exists():
            raise ValidationError("Email already exists")
        
        # Create user with transaction
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role
            )
            
            # Create profile if data provided
            if profile_data:
                from apps.users.models import Profile
                Profile.objects.update_or_create(
                    user=user,
                    defaults=profile_data
                )
            
            # Create passport profile
            from apps.passport.models import PassportProfile
            PassportProfile.objects.get_or_create(user=user)
        
        return user


class UpdateProfileService(BaseService):
    """Service for updating user profile"""
    
    def execute(self, user, profile_data):
        """
        Update user profile
        """
        from apps.users.models import Profile
        
        profile, created = Profile.objects.get_or_create(user=user)
        
        for field, value in profile_data.items():
            if hasattr(profile, field):
                setattr(profile, field, value)
        
        profile.save()
        return profile


class ChangePasswordService(BaseService):
    """Service for changing user password"""
    
    def execute(self, user, old_password, new_password):
        """
        Change user password
        """
        if not user.check_password(old_password):
            raise AuthenticationError("Old password is incorrect")
        
        user.set_password(new_password)
        user.save()
        return user


class DeactivateAccountService(BaseService):
    """Service for deactivating user account"""
    
    def execute(self, user):
        """
        Deactivate user account (soft delete)
        """
        user.is_active = False
        user.save()
        return user
