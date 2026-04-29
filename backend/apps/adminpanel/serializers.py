from rest_framework import serializers
from apps.tips.models import Tip
from apps.kilicaremoments.models import KilicareMoment
from apps.ai.models import AIActivity
from apps.users.models import User

# Users
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_verified', 'date_joined']

# Tips
class TipModerateSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Tip
        fields = [
            'id', 'title', 'description', 'category', 'created_by', 'created_by_username',
            'is_public', 'upvotes', 'created_at'
        ]

# Moments
class MomentModerateSerializer(serializers.ModelSerializer):
    posted_by_username = serializers.CharField(source='posted_by.username', read_only=True)

    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'caption', 'posted_by', 'posted_by_username', 'is_public', 'timestamp'
        ]

# AI Activities
class AIActivitySerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AIActivity
        fields = [
            'id', 'user', 'user_username',
            'input_text', 'output_text', 'action_type', 'timestamp'
        ]