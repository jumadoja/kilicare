from rest_framework import serializers
from .models import PassportProfile, PassportBadge, UserBadge, PassportActivity, PointsTransaction
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for passport responses"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role']

class PassportProfileSerializer(serializers.ModelSerializer):
    """Comprehensive passport profile serializer"""
    user_info = UserMinimalSerializer(source='user', read_only=True)
    level_info = serializers.SerializerMethodField()
    next_level_points = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = PassportProfile
        fields = [
            'user', 'user_info', 'trust_score', 'points', 'level', 'is_verified',
            'level_info', 'next_level_points', 'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'trust_score', 'level', 'created_at', 'updated_at']
    
    def get_level_info(self, obj):
        return obj.get_level_info()
    
    def get_next_level_points(self, obj):
        level_info = obj.get_level_info()
        current_level = level_info
        levels = [
            {'name': 'Newcomer', 'min_points': 0},
            {'name': 'Explorer', 'min_points': 50},
            {'name': 'Adventurer', 'min_points': 150},
            {'name': 'Expert', 'min_points': 300},
        ]
        
        for i, level in enumerate(levels):
            if level['name'] == current_level['name'] and i < len(levels) - 1:
                return levels[i + 1]['min_points']
        return 0
    
    def get_progress_percentage(self, obj):
        next_level = self.get_next_level_points(obj)
        if next_level == 0:
            return 100
        current_level_info = obj.get_level_info()
        progress = ((obj.points - current_level_info['min_points']) / (next_level - current_level_info['min_points'])) * 100
        return min(max(progress, 0), 100)

class PassportBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassportBadge
        fields = ['id', 'name', 'description', 'icon', 'criteria_points']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = PassportBadgeSerializer(read_only=True)
    is_unlocked = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['badge', 'unlocked_at', 'is_unlocked']

class PassportActivitySerializer(serializers.ModelSerializer):
    user_info = UserMinimalSerializer(source='user', read_only=True)
    action_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = PassportActivity
        fields = [
            'id', 'user_info', 'action_type', 'action_display', 'points_awarded',
            'metadata', 'created_at'
        ]
        ordering = ['-created_at']

class PointsTransactionSerializer(serializers.ModelSerializer):
    user_info = UserMinimalSerializer(source='user', read_only=True)
    transaction_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = PointsTransaction
        fields = [
            'id', 'user_info', 'transaction_type', 'transaction_display',
            'points_change', 'balance_after', 'description', 'metadata', 'created_at'
        ]
        ordering = ['-created_at']

class PassportStatisticsSerializer(serializers.Serializer):
    """Serializer for comprehensive passport statistics"""
    total_tips = serializers.IntegerField()
    total_moments = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    total_helpful_actions = serializers.IntegerField()
    points_earned = serializers.IntegerField()
    points_spent = serializers.IntegerField()
    response_rate = serializers.IntegerField()
    recent_activities = PassportActivitySerializer(many=True, read_only=True)
    badges_count = serializers.IntegerField()
    level_progress = serializers.DictField()

class LeaderboardSerializer(serializers.Serializer):
    """Serializer for leaderboard data"""
    rank = serializers.IntegerField()
    user_info = UserMinimalSerializer()
    passport_data = PassportProfileSerializer()
    statistics = PassportStatisticsSerializer()

# Action serializers for specific operations
class AwardPointsSerializer(serializers.Serializer):
    """Serializer for awarding points to users"""
    user_id = serializers.IntegerField()
    points = serializers.IntegerField(min_value=1)
    transaction_type = serializers.ChoiceField(
        choices=PointsTransaction.TRANSACTION_TYPES,
        default='ADMIN_ADJUSTMENT'
    )
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    metadata = serializers.JSONField(default=dict, required=False)

class CreateActivitySerializer(serializers.ModelSerializer):
    """Serializer for creating passport activities"""
    class Meta:
        model = PassportActivity
        fields = ['action_type', 'points_awarded', 'metadata']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
