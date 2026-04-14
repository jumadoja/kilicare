from rest_framework import serializers
from .models import *

class UserStringSerializer(serializers.StringRelatedField):
    def to_representation(self, value):
        return value.username

class MomentSerializer(serializers.ModelSerializer):
    posted_by = UserStringSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = KilicareMoment
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    user = UserStringSerializer(read_only=True)
    class Meta:
        model = MomentComment
        fields = '__all__'

class MusicSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundMusic
        fields = '__all__'

class FollowSerializer(serializers.ModelSerializer):
    follower = UserStringSerializer(read_only=True)
    following = UserStringSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = '__all__'

class AdminLogSerializer(serializers.ModelSerializer):
    admin = UserStringSerializer()
    class Meta:
        model = AdminActionLog
        fields = '__all__'
