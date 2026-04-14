from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Message, ChatRoom
from .serializers import MessageSerializer, ChatRoomSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class SendMessageView(generics.CreateAPIView):
    """ REST API Backup ya kutuma meseji (hasa kwa Media/Files) """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        receiver_id = self.request.data.get('receiver')
        user = self.request.user
        
        room = None
        if receiver_id:
            try:
                ids = sorted([int(user.id), int(receiver_id)])
                room_name = f"chat_{ids[0]}_{ids[1]}"
                room, created = ChatRoom.objects.get_or_create(name=room_name)
                if created:
                    room.participants.add(user, receiver_id)
            except (ValueError, TypeError):
                pass

        serializer.save(sender=user, room=room)

class MessageHistoryView(generics.ListAPIView):
    """ Inavuta historia ya meseji kati ya watu wawili ambayo haijafutwa """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        contact_id = self.kwargs.get('user_id')

        if contact_id:
            return Message.objects.filter(
                (Q(sender=user, receiver_id=contact_id) | 
                 Q(sender_id=contact_id, receiver=user))
            ).exclude(deleted_by=user).order_by('timestamp')
            
        return Message.objects.none()

class ChatContactsView(generics.ListAPIView):
    """ Orodha ya Contacts na picha kamili """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        user = request.user
        contact_ids = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).exclude(deleted_by=user).values_list('sender_id', 'receiver_id')

        flattened_ids = set()
        for s_id, r_id in contact_ids:
            if s_id != user.id: flattened_ids.add(s_id)
            if r_id != user.id: flattened_ids.add(r_id)

        if getattr(user, 'role', None) in ['TOURIST', 'LOCAL']:
            admin_ids = User.objects.filter(role='ADMIN').values_list('id', flat=True)
            all_contact_ids = flattened_ids.union(set(admin_ids))
        else:
            all_contact_ids = flattened_ids

        contacts_data = []
        contacts = User.objects.filter(id__in=all_contact_ids)

        for contact in contacts:
            last_msg = Message.objects.filter(
                (Q(sender=user, receiver=contact) | Q(sender=contact, receiver=user))
            ).exclude(deleted_by=user).order_by('-timestamp').first()

            if not last_msg and getattr(contact, 'role', None) != 'ADMIN':
                continue

            profile_url = "/media/default-avatar.png"
            passport = getattr(contact, 'passport', None)
            
            if passport and hasattr(passport, 'image') and passport.image:
                try:
                    profile_url = request.build_absolute_uri(passport.image.url)
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
                    sender=contact, 
                    receiver=user, 
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
        messages = Message.objects.filter(
            Q(sender=user, receiver_id=user_id) | 
            Q(sender_id=user_id, receiver=user)
        )
        
        for msg in messages:
            msg.deleted_by.add(user)
        
        return Response(
            {"status": "success", "message": "Chat yote imefichwa kwako."}, 
            status=status.HTTP_200_OK
        )