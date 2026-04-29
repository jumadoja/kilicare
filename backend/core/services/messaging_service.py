from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .base_service import BaseService
from ..exceptions import (
    ValidationError,
    NotFoundError,
)

User = get_user_model()


class SendMessageService(BaseService):
    """Service for sending messages"""
    
    def execute(self, sender, receiver_id, content, room_id=None, attachment=None):
        """
        Send a message to a user or room
        """
        if not content and not attachment:
            raise ValidationError("Message content or attachment is required")
        
        if len(content) > 4000:
            raise ValidationError("Message content too long (max 4000 characters)")
        
        from apps.messaging.models import ChatRoom, Message
        
        # Get or create room
        if room_id:
            try:
                room = ChatRoom.objects.get(id=room_id)
            except ChatRoom.DoesNotExist:
                raise NotFoundError("Chat room not found", resource_type="ChatRoom")
        else:
            # Create or get DM room
            if receiver_id:
                try:
                    receiver = User.objects.get(id=receiver_id)
                except User.DoesNotExist:
                    raise NotFoundError("Receiver not found", resource_type="User")
                
                ids = sorted([int(sender.id), int(receiver_id)])
                room_name = f"chat_{ids[0]}_{ids[1]}"
                room, created = ChatRoom.objects.get_or_create(
                    name=room_name,
                    defaults={'room_type': 'DM'}
                )
                if created:
                    room.participants.add(sender, receiver)
            else:
                raise ValidationError("Receiver ID required for new message")
        
        # Get receiver if not already set
        receiver = None
        if receiver_id:
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                pass
        
        if not receiver:
            receiver = room.participants.exclude(id=sender.id).first()
        
        # Create message
        message = Message.objects.create(
            room=room,
            sender=sender,
            content=content,
            attachment=attachment,
            is_delivered=True,
            delivered_at=timezone.now()
        )
        
        # Update room timestamp
        room.updated_at = timezone.now()
        room.save()
        
        # Send WebSocket notification
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{room.name}',
            {
                'type': 'chat_message',
                'action': 'message',
                'id': message.id,
                'message': content,
                'sender': sender.id,
                'sender_name': sender.username,
                'timestamp': message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                'room': room.id,
                'status': 'delivered'
            }
        )
        
        return message


class MarkMessagesAsReadService(BaseService):
    """Service for marking messages as read"""
    
    def execute(self, user, room_id=None, sender_id=None):
        """
        Mark messages as read for a user
        """
        from apps.messaging.models import Message
        
        queryset = Message.objects.filter(
            ~Q(sender=user),
            is_read=False
        )
        
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        if sender_id:
            queryset = queryset.filter(sender_id=sender_id)
        
        # Mark as read
        updated_count = queryset.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return {"updated_count": updated_count}


class DeleteMessageService(BaseService):
    """Service for deleting messages (soft delete)"""
    
    def execute(self, user, message_id):
        """
        Soft delete a message for a user
        """
        from apps.messaging.models import Message
        
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            raise NotFoundError("Message not found", resource_type="Message")
        
        # Only sender can delete their own messages
        if message.sender != user:
            raise ValidationError("You can only delete your own messages")
        
        # Add user to deleted_by (soft delete)
        message.deleted_by.add(user)
        
        return message


class DeleteChatService(BaseService):
    """Service for deleting entire chat (soft delete)"""
    
    def execute(self, user, other_user_id):
        """
        Soft delete all messages between two users
        """
        from apps.messaging.models import Message
        
        messages = Message.objects.filter(
            Q(sender=user, receiver_id=other_user_id) |
            Q(sender_id=other_user_id, receiver=user)
        )
        
        for msg in messages:
            msg.deleted_by.add(user)
        
        return {"deleted_count": messages.count()}


class GetChatContactsService(BaseService):
    """Service for getting user's chat contacts"""
    
    def execute(self, user):
        """
        Get list of users with whom the current user has chatted
        """
        from apps.messaging.models import Message
        
        # Get all contact IDs
        contact_ids = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).exclude(deleted_by=user).values_list('sender_id', 'receiver_id')
        
        flattened_ids = set()
        for s_id, r_id in contact_ids:
            if s_id != user.id:
                flattened_ids.add(s_id)
            if r_id != user.id:
                flattened_ids.add(r_id)
        
        # Add admins for tourists and locals
        if getattr(user, 'role', None) in ['TOURIST', 'LOCAL_GUIDE']:
            admin_ids = User.objects.filter(role='ADMIN').values_list('id', flat=True)
            flattened_ids = flattened_ids.union(set(admin_ids))
        
        contacts = User.objects.filter(id__in=flattened_ids)
        
        contacts_data = []
        for contact in contacts:
            last_msg = Message.objects.filter(
                (Q(sender=user, receiver=contact) | Q(sender=contact, receiver=user))
            ).exclude(deleted_by=user).order_by('-timestamp').first()
            
            if not last_msg and getattr(contact, 'role', None) != 'ADMIN':
                continue
            
            profile_url = "/media/default-avatar.png"
            passport = getattr(contact, 'passport', None)
            
            if passport and hasattr(passport, 'image') and passport.image:
                profile_url = passport.image.url
            
            contacts_data.append({
                "id": contact.id,
                "username": contact.username,
                "full_name": f"{contact.first_name} {contact.last_name}".strip() or contact.username,
                "profile_image": profile_url,
                "role": getattr(contact, 'role', 'USER'),
                "last_message": last_msg.content if last_msg else "Start chatting...",
                "timestamp": last_msg.timestamp if last_msg else None,
                "unread_count": Message.objects.filter(
                    sender=contact,
                    receiver=user,
                    is_read=False
                ).exclude(deleted_by=user).count()
            })
        
        # Sort by timestamp
        contacts_data = sorted(
            contacts_data,
            key=lambda x: (x['timestamp'] is not None, x['timestamp']),
            reverse=True
        )
        
        return contacts_data
