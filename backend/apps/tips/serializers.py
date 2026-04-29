from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tip, TipUpvote, TipReport

User = get_user_model()

class TipCreateSerializer(serializers.ModelSerializer):
    # Hii inahakikisha sub_topics ni array ya strings
    sub_topics = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = Tip
        fields = [
            "title",
            "description",
            "category",
            "sub_topics",
            "latitude",
            "longitude",
        ]


class TipListSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.username")
    sub_topics = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False
    )

    class Meta:
        model = Tip
        fields = [
            "id",
            "title",
            "description",
            "category",
            "sub_topics",
            "latitude",
            "longitude",
            "created_by",
            "upvotes",
            "created_at",
        ]


class TipSerializer(serializers.ModelSerializer):
    """Comprehensive tip serializer for detailed views"""
    created_by_info = serializers.SerializerMethodField()
    is_upvoted_by_user = serializers.SerializerMethodField()
    is_reported_by_user = serializers.SerializerMethodField()
    sub_topics = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False
    )
    
    class Meta:
        model = Tip
        fields = [
            'id', 'title', 'description', 'category', 'sub_topics',
            'latitude', 'longitude', 'location_address', 'created_by_info',
            'trust_score', 'upvotes', 'downvotes', 'reports', 'is_verified',
            'is_public', 'is_hidden', 'featured_until', 'created_at', 'updated_at',
            'is_upvoted_by_user', 'is_reported_by_user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'trust_score']
    
    def get_created_by_info(self, obj):
        return {
            'id': obj.created_by.id,
            'username': obj.created_by.username,
            'first_name': obj.created_by.first_name,
            'last_name': obj.created_by.last_name,
            'role': obj.created_by.role
        }
    
    def get_is_upvoted_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TipUpvote.objects.filter(user=request.user, tip=obj).exists()
        return False
    
    def get_is_reported_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TipReport.objects.filter(user=request.user, tip=obj).exists()
        return False

class TipUpvoteSerializer(serializers.ModelSerializer):
    """Serializer for tip upvotes"""
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = TipUpvote
        fields = ['id', 'user_info', 'tip', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name
        }