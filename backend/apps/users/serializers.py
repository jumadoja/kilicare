# serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import User, Profile, PasswordResetOTP
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Profile serializer
class ProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ('phone_number','bio','avatar','gender','dob','location')
    
    def get_avatar(self, obj):
        """Return relative URL for avatar - frontend constructs absolute URL"""
        if obj.avatar:
            return obj.avatar.url
        return None

    def validate_avatar(self, value):
        if value:
            # Validate file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Avatar size must not exceed 5MB")
            # Validate file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Avatar must be an image file")
        return value

# User serializer - STANDARDIZED UserDTO contract
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    # Write-only fields for registration (accept top-level, but only return in nested profile)
    bio = serializers.CharField(required=False, allow_blank=True, write_only=True)
    location = serializers.CharField(required=False, allow_blank=True, write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    # Optional passport data for enhanced responses
    passport_trust_score = serializers.IntegerField(source='passport.trust_score', read_only=True, allow_null=True)
    passport_level = serializers.IntegerField(source='passport.level', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_verified', 'is_online', 'first_name', 'last_name', 'date_joined', 'profile', 'bio', 'location', 'avatar', 'password', 'passport_trust_score', 'passport_level']
        extra_kwargs = {
            'role': {'required': True},
            'password': {'write_only': True}
        }

    def validate_role(self, value):
        if value not in ['TOURIST','LOCAL_GUIDE']:
            raise serializers.ValidationError("Invalid role")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username imeshatumika. Tumia nyingine.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email imeshatumika. Tumia nyingine.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        # Extract top-level bio and location for profile
        bio = validated_data.pop('bio', None)
        location = validated_data.pop('location', None)
        avatar = validated_data.pop('avatar', None)

        # Extract nested profile data if present
        profile_data = validated_data.pop('profile', {})

        # Merge bio, location, and avatar into profile_data
        if bio:
            profile_data['bio'] = bio
        if location:
            profile_data['location'] = location
        if avatar:
            profile_data['avatar'] = avatar

        # Create user with atomic transaction
        user = User.objects.create_user(**validated_data)
        
        # Create profile - single source of truth
        Profile.objects.update_or_create(user=user, defaults=profile_data)
        
        return user

# JWT Token serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Ensure user_id is included in token payload
        if self.user:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role,
                'is_verified': self.user.is_verified
            }
        return data

# Forgot Password serializer
class ForgotPasswordSerializer(serializers.Serializer):
    email_or_phone = serializers.CharField()
    username = serializers.CharField()

# Reset Password serializer
class ResetPasswordSerializer(serializers.Serializer):
    email_or_phone = serializers.CharField(required=False, allow_blank=True)
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])