import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Message, ChatRoom
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. AUTHENTICATION
        query_string = parse_qs(self.scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        try:
            if token:
                UntypedToken(token)
                self.user = self.scope['user']
                
                if self.user.is_anonymous:
                    await self.close(code=4001)
                    return
            else:
                await self.close(code=4003)
                return
        except (InvalidToken, TokenError):
            await self.close(code=4002)
            return

        # 2. ROOM SETUP
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user_id = str(self.user.id) if self.user and not self.user.is_anonymous else None

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # 3. ONLINE STATUS
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        # Cleanup user status and remove from all groups
        if hasattr(self, 'user_id') and self.user_id:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user_id,
                    'status': 'offline'
                }
            )
        
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        
        # Clean up any role-specific groups
        if hasattr(self, 'role_group_name') and self.role_group_name:
            await self.channel_layer.group_discard(self.role_group_name, self.channel_name)
        
        # Clear user data to prevent memory leaks
        self.user = None
        self.user_id = None
        self.room_name = None
        self.room_group_name = None

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON format'}))
            return
            
        action = data.get('action', 'message') 

        if action == 'message':
            message_text = data.get('message', '').strip()
            receiver_id = data.get('receiver_id', None)
            room_id = data.get('room_id', None)
            
            # Validate input
            if not message_text or len(message_text) > 4000:
                await self.send(text_data=json.dumps({'error': 'Message must be 1-4000 characters'}))
                return

            # Save to DB Asynchronously
            message_obj = await self.save_message(receiver_id, room_id, message_text)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'action': 'message',
                    'id': message_obj['id'],
                    'message': message_text,
                    'sender': self.user.id,
                    'sender_name': self.user.username,
                    'timestamp': message_obj['timestamp'],
                    'room': room_id,
                    'status': 'delivered'
                }
            )

        elif action == 'typing':
            is_typing = data.get('typing', False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_typing',
                    'action': 'typing',
                    'sender': self.user.id,
                    'typing': is_typing
                }
            )

        elif action == 'read_receipt':
            message_id = data.get('message_id')
            await self.mark_as_read(message_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_read',
                    'action': 'read_receipt',
                    'message_id': message_id,
                    'reader_id': self.user.id
                }
            )

    # --- HANDLERS ---
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps(event))

    async def chat_read(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_status(self, event):
        await self.send(text_data=json.dumps(event))

    # --- DATABASE METHODS ---
    @database_sync_to_async
    def save_message(self, receiver_id, room_id, content):
        # 1. Pata au tengeneza Room
        if room_id:
            try:
                room = ChatRoom.objects.get(id=room_id)
            except ChatRoom.DoesNotExist:
                room, _ = ChatRoom.objects.get_or_create(name=self.room_name)
        else:
            room, _ = ChatRoom.objects.get_or_create(name=self.room_name)

        # 2. Logic ya kumpata Receiver (Ili isilete None kwenye DB)
        receiver = None
        if receiver_id:
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                pass
        
        # Kama receiver bado ni None, mtafute participant mwingine kwenye room
        if not receiver:
            receiver = room.participants.exclude(id=self.user.id).first()

        # 3. OPTIMIZED: Hakikisha sender na receiver wamo kwenye room participants
        # Use bulk operations and caching for better performance
        current_participants = set(room.participants.values_list('id'))
        
        if receiver and receiver.id not in current_participants:
            room.participants.add(receiver)
            current_participants.add(receiver.id)
        if self.user.id not in current_participants:
            room.participants.add(self.user)
            current_participants.add(self.user.id)

        # 4. Create Message
        message = Message.objects.create(
            room=room,
            sender=self.user,
            receiver=receiver,
            content=content,
            is_delivered=True,
            delivered_at=timezone.now()
        )
        return {
            "id": message.id, 
            "timestamp": message.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }

    @database_sync_to_async
    def mark_as_read(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            # Hakikisha una method ya mark_as_read kwenye model yako au weka hivi:
            msg.is_read = True
            msg.read_at = timezone.now()
            msg.save()
        except Message.DoesNotExist:
            pass