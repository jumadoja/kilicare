from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *
from .dto import UserDTO, MomentDTO, CommentDTO, validate_moment_dto, normalize_moment_response

User = get_user_model()

# Music serializer for background music
class MusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundMusic
        fields = '__all__'

# DEPRECATED: Use UserDTO from dto.py instead
class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for API responses - DEPRECATED: Use UserDTO"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

# DEPRECATED: Use UserDTO from dto.py instead  
class UserWithPassportSerializer(serializers.ModelSerializer):
    """User with passport info for enhanced API responses - DEPRECATED: Use UserDTO"""
    passport_trust_score = serializers.IntegerField(source='passport.trust_score', read_only=True)
    passport_level = serializers.IntegerField(source='passport.level', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'passport_trust_score', 'passport_level']

class MomentSerializer(serializers.ModelSerializer):
    """
    REPLACEMENT: Uses standardized MomentDTO contract
    DEPRECATED: Use FeedMomentSerializer from dto.py for new code
    """
    # CRITICAL FIX: Use standardized field names
    shares = serializers.IntegerField(default=0, source='shares_count')  # Map from model field
    background_music = MusicSerializer(read_only=True)
    
    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'posted_by', 'media', 'media_type', 'caption', 'location',
            'latitude', 'longitude', 'views', 'shares', 'is_verified', 'is_featured',
            'visibility', 'is_hidden', 'content_warning', 'trending_score',
            'created_at', 'updated_at', 'likes_count', 'comments_count',
            'is_liked', 'is_saved', 'background_music'
        ]
        read_only_fields = ['posted_by', 'trending_score', 'views', 'shares']
    
    def to_representation(self, instance):
        """Normalize response to match DTO contract"""
        data = super().to_representation(instance)
        return normalize_moment_response(data)

class MomentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating moments"""
    class Meta:
        model = KilicareMoment
        fields = [
            'media', 'media_type', 'caption', 'location', 'latitude', 'longitude',
            'visibility', 'content_warning', 'background_music'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['posted_by'] = request.user
        moment = super().create(validated_data)
        # Calculate initial trending score
        moment.calculate_trending_score()
        return moment

class MomentListSerializer(serializers.ModelSerializer):
    """
    REPLACEMENT: Uses standardized MomentDTO contract
    DEPRECATED: Use FeedMomentSerializer from dto.py for new code
    """
    # Lightweight fields but still follows DTO contract
    shares = serializers.IntegerField(default=0, source='shares_count')  # Map from model field
    
    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'posted_by', 'media', 'media_type', 'caption', 'location',
            'is_verified', 'is_featured', 'trending_score', 'created_at',
            'likes_count', 'comments_count', 'shares'
        ]
    
    def to_representation(self, instance):
        """Normalize response to match DTO contract"""
        data = super().to_representation(instance)
        return normalize_moment_response(data)

class CommentSerializer(serializers.ModelSerializer):
    """
    REPLACEMENT: Uses standardized CommentDTO contract
    DEPRECATED: Use FeedCommentSerializer from dto.py for new code
    """
    
    class Meta:
        model = MomentComment
        fields = ['id', 'user', 'comment', 'created_at']
    
    def to_representation(self, instance):
        """Normalize response to match DTO contract"""
        data = super().to_representation(instance)
        
        # Ensure user follows UserDTO contract
        if 'user' in data and data['user']:
            user_data = data['user']
            if 'role' not in user_data:
                # Add missing role field
                user_data['role'] = instance.user.role
        
        return data

class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = '__all__'
    
    def get_follower(self, obj):
        """Return user data following UserDTO contract"""
        user_data = {
            'id': obj.follower.id,
            'username': obj.follower.username,
            'email': obj.follower.email,
            'role': obj.follower.role,
            'is_verified': obj.follower.is_verified,
            'first_name': obj.follower.first_name,
            'last_name': obj.follower.last_name,
            'date_joined': obj.follower.date_joined.isoformat() if obj.follower.date_joined else None,
        }
        return user_data
    
    def get_following(self, obj):
        """Return user data following UserDTO contract"""
        user_data = {
            'id': obj.following.id,
            'username': obj.following.username,
            'email': obj.following.email,
            'role': obj.following.role,
            'is_verified': obj.following.is_verified,
            'first_name': obj.following.first_name,
            'last_name': obj.following.last_name,
            'date_joined': obj.following.date_joined.isoformat() if obj.following.date_joined else None,
        }
        return user_data

class AdminLogSerializer(serializers.ModelSerializer):
    admin = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminActionLog
        fields = '__all__'
    
    def get_admin(self, obj):
        """Return user data following UserDTO contract"""
        user_data = {
            'id': obj.admin.id,
            'username': obj.admin.username,
            'email': obj.admin.email,
            'role': obj.admin.role,
            'is_verified': obj.admin.is_verified,
            'first_name': obj.admin.first_name,
            'last_name': obj.admin.last_name,
            'date_joined': obj.admin.date_joined.isoformat() if obj.admin.date_joined else None,
        }
        return user_data
