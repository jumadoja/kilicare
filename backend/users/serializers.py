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

# User serializer
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('id','username','email','password','role','is_verified','profile')
        extra_kwargs = {'role': {'required': True}}

    def validate_role(self, value):
        if value not in ['TOURIST','LOCAL']:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        user = User.objects.create_user(**validated_data)
        Profile.objects.update_or_create(user=user, defaults=profile_data)
        return user

# JWT Token serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
            "is_verified": self.user.is_verified,
        }
        data["access_token"] = data.pop("access")
        data["refresh_token"] = data.pop("refresh")
        return data

# Forgot Password serializer
class ForgotPasswordSerializer(serializers.Serializer):
    email_or_phone = serializers.CharField()
    username = serializers.CharField()

# Reset Password serializer
class ResetPasswordSerializer(serializers.Serializer):
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only=True)