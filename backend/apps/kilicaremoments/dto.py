"""
DTO Contract Layer - Single Source of Truth for Feed System

This module provides standardized data transfer objects that ensure
consistency between frontend and backend. All serializers must use these DTOs.

CRITICAL RULES:
- ALL field names are standardized
- NO conflicting serializers
- ALL API responses pass through DTO layer
- Frontend types must derive from these contracts
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import KilicareMoment, MomentComment

User = get_user_model()


class ProfileDTO(serializers.Serializer):
    """Standardized profile data contract"""
    avatar = serializers.SerializerMethodField()
    bio = serializers.CharField(allow_blank=True, required=False)
    location = serializers.CharField(allow_blank=True, required=False)
    phone_number = serializers.CharField(allow_blank=True, required=False)
    gender = serializers.CharField(allow_blank=True, required=False)
    dob = serializers.DateField(allow_null=True, required=False)
    
    def get_avatar(self, obj):
        """Return relative URL for avatar - frontend constructs absolute URL"""
        if obj and hasattr(obj, 'avatar') and obj.avatar:
            return obj.avatar.url
        return None


class UserDTO(serializers.Serializer):
    """Standardized user data contract - SINGLE SOURCE OF TRUTH"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()  # CRITICAL: Always included
    is_verified = serializers.BooleanField()
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    date_joined = serializers.DateTimeField(read_only=True)
    
    # Nested profile - STANDARDIZED STRUCTURE
    profile = ProfileDTO(required=False, allow_null=True)
    
    # Optional passport data for enhanced responses
    passport_trust_score = serializers.IntegerField(source='passport.trust_score', read_only=True, allow_null=True)
    passport_level = serializers.IntegerField(source='passport.level', read_only=True, allow_null=True)


class MomentDTO(serializers.Serializer):
    """Standardized moment data contract - SINGLE SOURCE OF TRUTH"""
    id = serializers.IntegerField()
    caption = serializers.CharField(allow_blank=True, required=False)
    media = serializers.SerializerMethodField()
    media_type = serializers.CharField()
    location = serializers.CharField(allow_blank=True, required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, allow_null=True, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, allow_null=True, required=False)
    
    # Engagement metrics - STANDARDIZED NAMES
    views = serializers.IntegerField(default=0)
    shares = serializers.IntegerField(default=0)  # CRITICAL: ONLY 'shares', not 'shares_count'
    likes_count = serializers.IntegerField(read_only=True, source='likes.count')
    comments_count = serializers.IntegerField(read_only=True, source='comments.count')
    
    # Status fields
    is_verified = serializers.BooleanField(default=False)
    is_featured = serializers.BooleanField(default=False)
    visibility = serializers.CharField()
    is_hidden = serializers.BooleanField(default=False)
    content_warning = serializers.CharField(allow_blank=True, required=False)
    
    # Trending
    trending_score = serializers.FloatField(default=0.0)
    
    # Timestamps
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    
    # User - ALWAYS use UserDTO
    posted_by = UserDTO(read_only=True)
    
    # Interaction status for current user
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import SavedMoment
            return SavedMoment.objects.filter(user=request.user, moment=obj).exists()
        return False
    
    def get_media(self, obj):
        """Return relative URL for media - frontend constructs absolute URL"""
        if obj and hasattr(obj, 'media') and obj.media:
            return obj.media.url
        return None


class CommentDTO(serializers.Serializer):
    """Standardized comment data contract"""
    id = serializers.IntegerField()
    comment = serializers.CharField()
    created_at = serializers.DateTimeField()
    
    # User - ALWAYS use UserDTO
    user = UserDTO(read_only=True)


class FeedItemDTO(serializers.Serializer):
    """
    Complete feed item contract - combines moment with user data
    This is the PRIMARY contract for feed responses
    """
    moment = MomentDTO()
    user = UserDTO(source='moment.posted_by')
    
    # Additional feed-specific metadata
    feed_score = serializers.FloatField(default=0.0)
    is_following_author = serializers.BooleanField(default=False)


class PaginatedFeedDTO(serializers.Serializer):
    """Standardized paginated feed response"""
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True, required=False)
    previous = serializers.URLField(allow_null=True, required=False)
    results = serializers.ListField(child=FeedItemDTO())


# LEGACY SERIALIZER MIGRATION HELPERS
# Note: FeedMomentSerializer is defined in feed_serializers.py to avoid import conflicts


class FeedUserSerializer(UserDTO):
    """
    REPLACEMENT for UserMinimalSerializer, UserWithPassportSerializer
    Uses standardized DTO contract
    """
    pass


class FeedCommentSerializer(CommentDTO):
    """
    REPLACEMENT for CommentSerializer
    Uses standardized DTO contract
    """
    pass


# CONTRACT VALIDATION UTILITIES

class DTOValidationError(Exception):
    """Raised when DTO contract is violated"""
    pass


def validate_moment_dto(data):
    """Validate moment data against DTO contract"""
    required_fields = ['id', 'caption', 'media', 'media_type', 'posted_by']
    for field in required_fields:
        if field not in data:
            raise DTOValidationError(f"Missing required field: {field}")
    
    # CRITICAL: Ensure field name consistency
    if 'shares_count' in data:
        raise DTOValidationError("Use 'shares' instead of 'shares_count'")
    
    if 'posted_by' in data and 'role' not in data['posted_by']:
        raise DTOValidationError("User data must include 'role' field")
    
    return True


def validate_user_dto(data):
    """Validate user data against DTO contract"""
    required_fields = ['id', 'username', 'email', 'role']
    for field in required_fields:
        if field not in data:
            raise DTOValidationError(f"Missing required user field: {field}")
    
    # CRITICAL: Check profile structure
    if 'profile' in data and data['profile']:
        if 'avatar' in data['profile'] and isinstance(data['profile']['avatar'], str):
            # Avatar should be URL string, not nested object
            pass  # This is expected
    
    return True


# RESPONSE NORMALIZATION UTILITIES

def normalize_moment_response(moment_data):
    """
    Normalize moment response to match DTO contract
    This fixes inconsistencies between different serializers
    """
    normalized = moment_data.copy()
    
    # Fix field name inconsistencies
    if 'shares_count' in normalized:
        normalized['shares'] = normalized.pop('shares_count')
    
    # Ensure user data structure
    if 'posted_by' in normalized:
        user_data = normalized['posted_by']
        
        # Ensure role is present
        if 'role' not in user_data:
            raise DTOValidationError("User data missing required 'role' field")
        
        # Normalize profile structure
        if 'profile' in user_data and user_data['profile']:
            profile = user_data['profile']
            # Ensure avatar is string URL
            if 'avatar' in profile and profile['avatar']:
                if isinstance(profile['avatar'], object) and hasattr(profile['avatar'], 'url'):
                    profile['avatar'] = profile['avatar'].url
    
    return normalized


def normalize_feed_response(feed_data):
    """Normalize paginated feed response"""
    if 'results' in feed_data:
        feed_data['results'] = [
            normalize_moment_response(moment) 
            for moment in feed_data['results']
        ]
    return feed_data
