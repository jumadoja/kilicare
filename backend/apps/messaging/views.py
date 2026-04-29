from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Message, ChatRoom
from .serializers import MessageSerializer, ChatRoomSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.services.messaging_service import SendMessageService

User = get_user_model()

class SendMessageView(generics.CreateAPIView):
    """ REST API Backup ya kutuma meseji (hasa kwa Media/Files) """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        receiver_id = self.request.data.get('receiver')
        user = self.request.user
        
        # Use service layer for message sending
        service = SendMessageService(
            sender=user,
            receiver_id=receiver_id,
            content=serializer.validated_data.get('content'),
            attachment=serializer.validated_data.get('attachment'),
            reply_to_id=serializer.validated_data.get('reply_to')
        )
        
        message = service.execute()
        serializer.instance = message

class MessageHistoryView(generics.ListAPIView):
    """ Inavuta historia ya meseji kati ya watu wawili ambayo haijafutwa """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        contact_id = self.kwargs.get('user_id')

        if contact_id:
            return Message.objects.filter(
                (Q(sender=user) | Q(sender_id=contact_id)),
                room__participants=contact_id
            ).exclude(deleted_by=user).order_by('timestamp')
            
        return Message.objects.none()

class ChatContactsView(generics.ListAPIView):
    """ Orodha ya Contacts na picha kamili """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        user = request.user
        # Get all rooms user participates in
        rooms = ChatRoom.objects.filter(participants=user)
        
        contact_ids = set()
        for room in rooms:
            contact_ids.update(room.participants.exclude(id=user.id).values_list('id', flat=True))

        if getattr(user, 'role', None) in ['TOURIST', 'LOCAL']:
            admin_ids = User.objects.filter(role='ADMIN').values_list('id', flat=True)
            all_contact_ids = contact_ids.union(set(admin_ids))
        else:
            all_contact_ids = contact_ids

        contacts_data = []
        contacts = User.objects.filter(id__in=all_contact_ids)

        for contact in contacts:
            # Get last message from any shared room
            shared_rooms = ChatRoom.objects.filter(participants__in=[user, contact]).distinct()
            last_msg = Message.objects.filter(
                room__in=shared_rooms
            ).exclude(deleted_by=user).order_by('-timestamp').first()

            if not last_msg and getattr(contact, 'role', None) != 'ADMIN':
                continue

            profile_url = "/media/default-avatar.png"
            profile = getattr(contact, 'profile', None)
            
            if profile and hasattr(profile, 'avatar') and profile.avatar:
                try:
                    profile_url = request.build_absolute_uri(profile.avatar.url)
                except (ValueError, AttributeError):
                    profile_url = "/media/default-avatar.png"

            contacts_data.append({
                "id": contact.id,
                "username": contact.username,
                "full_name": f"{contact.first_name} {contact.last_name}".strip() or contact.username,
                "profile_image": profile_url,
                "role": getattr(contact, 'role', 'USER'),
                "last_message": last_msg.content if last_msg else "Anza chati na Admin...",
                "timestamp": last_msg.timestamp if last_msg else None,
                "is_online": getattr(contact, 'is_online', False),
                "unread_count": Message.objects.filter(
                    room__in=shared_rooms,
                    is_read=False
                ).exclude(deleted_by=user).count()
            })

        contacts_data = sorted(
            contacts_data, 
            key=lambda x: (x['timestamp'] is not None, x['timestamp']), 
            reverse=True
        )
        return Response(contacts_data)

class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        room = serializer.save()
        room.participants.add(self.request.user)

# --- MPYA: KUFUTA UJUMBE MMOJA (Fixes 404 Error) ---
class DeleteSingleMessageView(APIView):
    """ Inafuta ujumbe mmoja tu kwa kuongeza user kwenye 'deleted_by' list """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, message_id):
        try:
            # Tunatafuta message mahususi
            message = Message.objects.get(id=message_id)
            # Tunai-hide kwa huyu user aliyelogin
            message.deleted_by.add(request.user)
            return Response({"detail": "Ujumbe umefutwa."}, status=status.HTTP_200_OK)
        except Message.DoesNotExist:
            return Response({"error": "Ujumbe haupo."}, status=status.HTTP_404_NOT_FOUND)

# --- ILYOBORESHWA: KUFUTA CHATI NZIMA ---
class DeleteChatView(APIView):
    """ Inaficha chati nzima kati ya huyu user na mwingine """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        user = request.user
        # Get shared rooms
        shared_rooms = ChatRoom.objects.filter(participants__in=[user, user_id]).distinct()
        
        messages = Message.objects.filter(room__in=shared_rooms)
        
        for msg in messages:
            msg.deleted_by.add(user)
        
        return Response(
            {"status": "success", "message": "Chat yote imefichwa kwako."}, 
            status=status.HTTP_200_OK
        )