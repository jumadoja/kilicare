"""
Production-Grade Feed Serializers - DTO Contract Only

These serializers replace ALL inconsistent serializers and provide
a single source of truth for feed API responses.

CRITICAL RULES:
- ONLY use DTO contracts
- NO field name inconsistencies  
- ALL responses include required fields
- NO legacy serializers mixed in
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .dto import (
    UserDTO, ProfileDTO, MomentDTO, CommentDTO, 
    FeedItemDTO, PaginatedFeedDTO,
    normalize_moment_response, normalize_feed_response,
    validate_moment_dto, validate_user_dto
)
from .models import KilicareMoment, MomentComment, BackgroundMusic

User = get_user_model()


class FeedUserSerializer(UserDTO):
    """
    STANDARDIZED user serializer for all feed responses
    REPLACEMENT: UserMinimalSerializer, UserWithPassportSerializer
    """
    pass


class FeedProfileSerializer(ProfileDTO):
    """
    STANDARDIZED profile serializer
    """
    pass


class MusicSerializer(serializers.ModelSerializer):
    """Serializer for background music"""
    class Meta:
        model = BackgroundMusic
        fields = ['id', 'title', 'file', 'description']


class FeedMomentSerializer(MomentDTO):
    """
    STANDARDIZED moment serializer for all feed responses
    REPLACEMENT: MomentSerializer, MomentListSerializer
    
    Uses DTO contract exclusively with proper field mapping
    """
    # Map model fields to DTO field names
    shares = serializers.IntegerField(source='shares_count', read_only=True)
    background_music = MusicSerializer(read_only=True)
    
    class Meta:
        model = KilicareMoment
        fields = [
            'id', 'caption', 'media', 'media_type', 'location', 
            'latitude', 'longitude', 'views', 'shares', 'likes_count', 
            'comments_count', 'is_verified', 'is_featured', 'visibility',
            'is_hidden', 'content_warning', 'trending_score', 
            'created_at', 'updated_at', 'posted_by', 'is_liked', 'is_saved', 'is_following', 'background_music'
        ]
        read_only_fields = ['posted_by', 'trending_score', 'views', 'shares', 'is_following']
    
    is_following = serializers.SerializerMethodField()
    
    def get_is_following(self, obj):
        """Check if current user is following the moment creator"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.kilicaremoments.models import Follow
            return Follow.objects.filter(
                follower=request.user,
                following=obj.posted_by
            ).exists()
        return False
    
    def to_representation(self, instance):
        """Ensure DTO contract compliance"""
        data = super().to_representation(instance)
        return normalize_moment_response(data)


class FeedCommentSerializer(CommentDTO):
    """
    STANDARDIZED comment serializer for all feed responses
    REPLACEMENT: CommentSerializer
    """
    
    class Meta:
        model = MomentComment
        fields = ['id', 'comment', 'created_at', 'user']
    
    def to_representation(self, instance):
        """Ensure DTO contract compliance"""
        data = super().to_representation(instance)
        
        # Ensure user data follows UserDTO contract
        if 'user' in data and data['user']:
            user_data = data['user']
            if 'role' not in user_data:
                user_data['role'] = instance.user.role
        
        return data


class FeedItemSerializer(FeedItemDTO):
    """
    Complete feed item serializer for feed endpoints
    Combines moment with user data and feed metadata
    """
    
    def to_representation(self, instance):
        """Create proper FeedItemDTO structure"""
        if isinstance(instance, KilicareMoment):
            # Direct moment instance
            moment_serializer = FeedMomentSerializer(instance, context=self.context)
            moment_data = moment_serializer.data
            
            return {
                'moment': moment_data,
                'user': moment_data['posted_by'],
                'feed_score': getattr(instance, 'trending_score', 0.0),
                'is_following_author': False  # Will be calculated in view
            }
        else:
            # Already structured data
            return super().to_representation(instance)


class PaginatedFeedSerializer(PaginatedFeedDTO):
    """
    STANDARDIZED paginated feed response
    ALL feed endpoints must use this serializer
    """
    results = FeedItemSerializer(many=True, read_only=True)
    
    def to_representation(self, data):
        """Ensure full DTO compliance"""
        response = super().to_representation(data)
        return normalize_feed_response(response)


# === CREATE/MUTATION SERIALIZERS ===

class CreateMomentSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new moments
    Uses validation but not DTO for input (DTO is for output)
    """

    class Meta:
        model = KilicareMoment
        fields = [
            'media', 'media_type', 'caption', 'location',
            'latitude', 'longitude', 'visibility', 'content_warning', 'background_music'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['posted_by'] = request.user
        moment = super().create(validated_data)
        # Calculate initial trending score
        moment.calculate_trending_score()
        return moment


class CreateCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for creating comments
    """
    
    class Meta:
        model = MomentComment
        fields = ['comment']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


# === INTERACTION SERIALIZERS ===

class MomentLikeSerializer(serializers.Serializer):
    """
    Serializer for like/unlike responses
    Returns DTO-compliant data
    """
    is_liked = serializers.BooleanField()
    likes_count = serializers.IntegerField()


class MomentSaveSerializer(serializers.Serializer):
    """
    Serializer for save/unsave responses
    Returns DTO-compliant data
    """
    is_saved = serializers.BooleanField()


class MomentShareSerializer(serializers.Serializer):
    """
    Serializer for share responses
    Returns DTO-compliant data
    """
    shares_count = serializers.IntegerField()


class FollowSerializer(serializers.Serializer):
    """
    Serializer for follow/unfollow responses
    Returns DTO-compliant user data
    """
    follower = FeedUserSerializer(read_only=True)
    following = FeedUserSerializer(read_only=True)
    is_following = serializers.BooleanField()


# === LEGACY COMPATIBILITY ===

# These aliases ensure backward compatibility while forcing DTO usage
UserMinimalSerializer = FeedUserSerializer  # DEPRECATED
UserWithPassportSerializer = FeedUserSerializer  # DEPRECATED
MomentSerializer = FeedMomentSerializer  # DEPRECATED
MomentListSerializer = FeedMomentSerializer  # DEPRECATED
CommentSerializer = FeedCommentSerializer  # DEPRECATED
