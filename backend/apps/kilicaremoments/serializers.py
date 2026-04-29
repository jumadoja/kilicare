from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for API responses"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class UserWithPassportSerializer(serializers.ModelSerializer):
    """User with passport info for enhanced API responses"""
    passport_trust_score = serializers.IntegerField(source='passport.trust_score', read_only=True)
    passport_level = serializers.IntegerField(source='passport.level', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'passport_trust_score', 'passport_level']

class MomentSerializer(serializers.ModelSerializer):
    posted_by = UserWithPassportSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    shares_count = serializers.IntegerField(source='shares', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'posted_by', 'media', 'media_type', 'caption', 'location',
            'latitude', 'longitude', 'views', 'shares', 'is_verified', 'is_featured',
            'visibility', 'is_hidden', 'content_warning', 'trending_score',
            'created_at', 'updated_at', 'likes_count', 'comments_count',
            'shares_count', 'is_liked', 'is_saved'
        ]
        read_only_fields = ['posted_by', 'trending_score', 'views', 'shares']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedMoment.objects.filter(user=request.user, moment=obj).exists()
        return False

class MomentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating moments"""
    class Meta:
        model = KilicareMoment
        fields = [
            'media', 'media_type', 'caption', 'location', 'latitude', 'longitude',
            'visibility', 'content_warning'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['posted_by'] = request.user
        moment = super().create(validated_data)
        # Calculate initial trending score
        moment.calculate_trending_score()
        return moment

class MomentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    posted_by = UserMinimalSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'posted_by', 'media', 'media_type', 'caption', 'location',
            'is_verified', 'is_featured', 'trending_score', 'created_at',
            'likes_count', 'comments_count'
        ]

class CommentSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    class Meta:
        model = MomentComment
        fields = '__all__'

class MusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundMusic
        fields = '__all__'

class FollowSerializer(serializers.ModelSerializer):
    follower = UserMinimalSerializer(read_only=True)
    following = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = '__all__'

class AdminLogSerializer(serializers.ModelSerializer):
    admin = UserMinimalSerializer()
    class Meta:
        model = AdminActionLog
        fields = '__all__'
