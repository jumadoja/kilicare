from rest_framework import serializers
from .models import Message, ChatRoom
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    sender_profile = serializers.SerializerMethodField()
    receiver_profile = serializers.SerializerMethodField()
    
    # REKEBISHO: Room isiwe lazima wakati wa ku-POST (itaandaliwa na Backend)
    room = serializers.PrimaryKeyRelatedField(queryset=ChatRoom.objects.all(), required=False, allow_null=True)
    # REKEBISHO: Sender itachukuliwa kutoka kwa request.user, isilazimishe kutumwa toka React
    sender = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'receiver', 'receiver_username', 'room', 'room_name',
            'content', 'attachment', 'timestamp', 'is_delivered', 'delivered_at', 
            'is_read', 'read_at', 'reply_to', 'sender_username', 
            'sender_profile', 'receiver_profile', 'is_deleted'
        ]
        read_only_fields = [
            'id', 'timestamp', 'sender_username', 'sender_profile', 
            'receiver_profile', 'is_delivered', 'delivered_at', 'is_read', 'read_at'
        ]

    def get_sender_profile(self, obj):
        # Inatafuta kama user ana profile na picha, isipopata inatoa default path
        profile = getattr(obj.sender, 'profile', None)
        if profile and getattr(profile, 'image', None):
            return profile.image.url
        return "/media/default-avatar.png"

    def get_receiver_profile(self, obj):
        # Inatafuta kama receiver ana profile na picha
        if obj.receiver:
            profile = getattr(obj.receiver, 'profile', None)
            if profile and getattr(profile, 'image', None):
                return profile.image.url
        return "/media/default-avatar.png"


class ChatRoomSerializer(serializers.ModelSerializer):
    participants_usernames = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'room_type', 'participants', 'participants_usernames', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participants_usernames(self, obj):
        # Inavuta usernames za washiriki wote kwenye chumba/group
        return [user.username for user in obj.participants.all()]