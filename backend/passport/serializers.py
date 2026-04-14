from rest_framework import serializers
from .models import PassportProfile, PassportBadge, UserBadge, PassportActivity
from django.contrib.auth import get_user_model

User = get_user_model()

class PassportProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassportProfile
        fields = ['user', 'trust_score', 'points', 'level', 'is_verified']

class PassportBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassportBadge
        fields = ['id', 'name', 'description', 'icon', 'criteria_points']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = PassportBadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ['badge', 'unlocked_at']

class PassportActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PassportActivity
        fields = ['user', 'action_type', 'points_awarded', 'metadata', 'created_at']
