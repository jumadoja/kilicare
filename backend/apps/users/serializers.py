# serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile, PasswordResetOTP
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Profile serializer
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('phone_number','bio','avatar','gender','dob','location')

    def validate_avatar(self, value):
        if value:
            # Validate file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Avatar size must not exceed 5MB")
            # Validate file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Avatar must be an image file")
        return value

# User serializer
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id','username','email','first_name','last_name','password','role','is_verified','profile','bio','location','avatar')
        extra_kwargs = {'role': {'required': True}}

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

        user = User.objects.create_user(**validated_data)
        Profile.objects.update_or_create(user=user, defaults=profile_data)
        return user

# JWT Token serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        print("SERIALIZER STEP 1: validate method called")
        print(f"SERIALIZER STEP 2: attrs = {attrs}")
        data = super().validate(attrs)
        print("SERIALIZER STEP 3: super().validate() completed")
        print(f"SERIALIZER STEP 4: data from super = {data}")
        # Standard response format: all payload data inside data object
        payload = {
            "access_token": data.pop("access"),
            "refresh_token": data.pop("refresh"),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "email": self.user.email,
                "role": self.user.role,
                "is_verified": self.user.is_verified,
            }
        }
        print("SERIALIZER STEP 5: payload created")
        # Return standardized structure
        result = {
            "status": "success",
            "message": "Umefanikiwa kuingia. Karibu KilicareGO+",
            "data": payload
        }
        print("SERIALIZER STEP 6: returning result")
        return result

# Forgot Password serializer
class ForgotPasswordSerializer(serializers.Serializer):
    email_or_phone = serializers.CharField()
    username = serializers.CharField()

# Reset Password serializer
class ResetPasswordSerializer(serializers.Serializer):
    email_or_phone = serializers.CharField(required=False, allow_blank=True)
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])