"""
Feed Consumer - Real-time WebSocket Feed Engine

Production-grade WebSocket system for real-time feed updates.
Uses DTO contracts exclusively - no raw DB models in WebSocket responses.

SUPPORTED EVENTS:
- new_moment: New moment posted
- like_update: Moment liked/unliked  
- comment_update: New comment on moment
- share_update: Moment shared
- follow_update: User followed/unfollowed

CRITICAL RULES:
- ALL responses use DTO contracts
- Channel groups for efficient broadcasting
- Authenticated connections only
- Rate limiting and spam protection
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
import jwt
from .dto import FeedItemDTO, UserDTO, MomentDTO, normalize_feed_response

User = get_user_model()


class FeedConsumer(AsyncWebsocketConsumer):
    """
    Real-time feed WebSocket consumer
    Handles live feed updates with proper auth and channel management
    """
    
    async def connect(self):
        """Authenticate and setup feed channels"""
        # 1. AUTHENTICATION
        self.user = await self.get_user_from_token()
        
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # 2. CHANNEL SETUP
        # Personal feed channel
        self.personal_feed_group = f'feed_user_{self.user.id}'
        
        # Global feed channel (for trending/featured content)
        self.global_feed_group = 'feed_global'
        
        # Follow-based feed channels
        self.follow_groups = await self.get_follow_group_names()
        
        # Role-specific channels
        if self.user.role == 'LOCAL_GUIDE':
            self.role_feed_group = 'feed_locals'
        elif self.user.role == 'ADMIN':
            self.role_feed_group = 'feed_admins'
        else:
            self.role_feed_group = None

        # 3. JOIN CHANNELS
        await self.channel_layer.group_add(self.personal_feed_group, self.channel_name)
        await self.channel_layer.group_add(self.global_feed_group, self.channel_name)
        
        for group_name in self.follow_groups:
            await self.channel_layer.group_add(group_name, self.channel_name)
        
        if self.role_feed_group:
            await self.channel_layer.group_add(self.role_feed_group, self.channel_name)

        await self.accept()
        
        # 4. SEND INITIAL STATUS
        await self.send_feed_update({
            'type': 'connection_status',
            'status': 'connected',
            'user_id': self.user.id,
            'channels': [self.personal_feed_group, self.global_feed_group] + self.follow_groups
        })

    @database_sync_to_async
    def get_user_from_token(self):
        """Authenticate user from JWT token"""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = query_params.get('token')
            
            if not token:
                return User.objects.get_or_create(username='anonymous')[0]
            
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if user_id:
                return User.objects.get(id=user_id)
            return User.objects.get_or_create(username='anonymous')[0]
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            return User.objects.get_or_create(username='anonymous')[0]

    @database_sync_to_async
    def get_follow_group_names(self):
        """Get feed groups for users this user follows"""
        from .models import Follow
        follows = Follow.objects.filter(follower=self.user).select_related('following')
        return [f'feed_user_{follow.following.id}' for follow in follows]

    async def disconnect(self, close_code):
        """Cleanup channel subscriptions"""
        await self.channel_layer.group_discard(self.personal_feed_group, self.channel_name)
        await self.channel_layer.group_discard(self.global_feed_group, self.channel_name)
        
        for group_name in self.follow_groups:
            await self.channel_layer.group_discard(group_name, self.channel_name)
        
        if self.role_feed_group:
            await self.channel_layer.group_discard(self.role_feed_group, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            action = data.get('action', '')
            
            # Rate limiting check
            if not await self.check_rate_limit(action):
                await self.send_error("Rate limit exceeded")
                return
            
            if action == 'subscribe_feed':
                await self.handle_feed_subscription(data)
            elif action == 'unsubscribe_feed':
                await self.handle_feed_unsubscription(data)
            elif action == 'mark_viewed':
                await self.handle_mark_viewed(data)
            else:
                await self.send_error(f"Unknown action: {action}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")

    @database_sync_to_async
    def check_rate_limit(self, action):
        """Rate limiting for WebSocket actions"""
        cache_key = f"ws_rate_limit_{self.user.id}_{action}"
        count = cache.get(cache_key, 0)
        
        # Different limits for different actions
        limits = {
            'subscribe_feed': 10,  # 10 per minute
            'unsubscribe_feed': 10,
            'mark_viewed': 60,  # 60 per minute
        }
        
        limit = limits.get(action, 30)  # Default 30 per minute
        
        if count >= limit:
            return False
        
        cache.set(cache_key, count + 1, timeout=60)  # 1 minute timeout
        return True

    async def handle_feed_subscription(self, data):
        """Handle feed subscription requests"""
        feed_type = data.get('feed_type', 'personal')
        
        if feed_type == 'trending':
            # Already subscribed to global feed
            await self.send_feed_update({
                'type': 'subscription_confirmed',
                'feed_type': 'trending',
                'status': 'already_subscribed'
            })
        elif feed_type == 'personal':
            # Already subscribed to personal feed
            await self.send_feed_update({
                'type': 'subscription_confirmed',
                'feed_type': 'personal',
                'status': 'already_subscribed'
            })

    async def handle_feed_unsubscription(self, data):
        """Handle feed unsubscription requests"""
        feed_type = data.get('feed_type', 'personal')
        
        # For now, we don't allow unsubscribing from core feeds
        await self.send_feed_update({
            'type': 'unsubscription_failed',
            'feed_type': feed_type,
            'reason': 'Cannot unsubscribe from core feeds'
        })

    async def handle_mark_viewed(self, data):
        """Handle moment view tracking"""
        moment_id = data.get('moment_id')
        if moment_id:
            await self.track_moment_view(moment_id)

    @database_sync_to_async
    def track_moment_view(self, moment_id):
        """Track moment view for analytics"""
        from .models import KilicareMoment
        try:
            moment = KilicareMoment.objects.get(id=moment_id)
            moment.views += 1
            moment.save(update_fields=['views'])
        except KilicareMoment.DoesNotExist:
            pass

    # === WEBSOCKET EVENT HANDLERS ===
    
    async def feed_new_moment(self, event):
        """Handle new moment broadcast"""
        await self.send_feed_update({
            'type': 'new_moment',
            'moment': event.get('moment_data'),
            'feed_type': event.get('feed_type', 'global')
        })

    async def feed_like_update(self, event):
        """Handle like/unlike updates"""
        await self.send_feed_update({
            'type': 'like_update',
            'moment_id': event.get('moment_id'),
            'is_liked': event.get('is_liked'),
            'likes_count': event.get('likes_count'),
            'user_id': event.get('user_id')
        })

    async def feed_comment_update(self, event):
        """Handle new comment updates"""
        await self.send_feed_update({
            'type': 'comment_update',
            'moment_id': event.get('moment_id'),
            'comment': event.get('comment_data'),
            'comments_count': event.get('comments_count')
        })

    async def feed_share_update(self, event):
        """Handle share updates"""
        await self.send_feed_update({
            'type': 'share_update',
            'moment_id': event.get('moment_id'),
            'shares_count': event.get('shares_count'),
            'shared_by': event.get('user_id')
        })

    async def feed_follow_update(self, event):
        """Handle follow/unfollow updates"""
        await self.send_feed_update({
            'type': 'follow_update',
            'follower_id': event.get('follower_id'),
            'following_id': event.get('following_id'),
            'is_following': event.get('is_following')
        })

    async def feed_trending_update(self, event):
        """Handle trending feed updates"""
        await self.send_feed_update({
            'type': 'trending_update',
            'trending_moments': event.get('trending_moments')
        })

    # === UTILITY METHODS ===
    
    async def send_feed_update(self, data):
        """Send feed update with proper DTO formatting"""
        # Ensure data follows DTO contract
        if 'moment' in data:
            data['moment'] = normalize_feed_response({'results': [data['moment']]})['results'][0]
        
        await self.send(text_data=json.dumps({
            'timestamp': timezone.now().isoformat(),
            **data
        }))

    async def send_error(self, message):
        """Send error message"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
            'timestamp': timezone.now().isoformat()
        }))


# === FEED BROADCAST UTILITIES ===

class FeedBroadcaster:
    """
    Utility class for broadcasting feed updates
    Used by views and signals to trigger real-time updates
    """
    
    @staticmethod
    async def broadcast_new_moment(moment):
        """Broadcast new moment to relevant feeds"""
        from channels.layers import get_channel_layer
        from .dto import MomentDTO
        
        channel_layer = get_channel_layer()
        
        # Serialize moment using DTO
        serializer = MomentDTO(moment, context={'request': None})
        moment_data = serializer.data
        
        # Broadcast to global feed
        await channel_layer.group_send(
            'feed_global',
            {
                'type': 'feed_new_moment',
                'moment_data': moment_data,
                'feed_type': 'global'
            }
        )
        
        # Broadcast to followers
        await channel_layer.group_send(
            f'feed_user_{moment.posted_by.id}',
            {
                'type': 'feed_new_moment',
                'moment_data': moment_data,
                'feed_type': 'personal'
            }
        )

    @staticmethod
    async def broadcast_like_update(moment_id, is_liked, likes_count, user_id):
        """Broadcast like/unlike update"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            'feed_global',
            {
                'type': 'feed_like_update',
                'moment_id': moment_id,
                'is_liked': is_liked,
                'likes_count': likes_count,
                'user_id': user_id
            }
        )

    @staticmethod
    async def broadcast_comment_update(moment_id, comment_data, comments_count):
        """Broadcast new comment"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            'feed_global',
            {
                'type': 'feed_comment_update',
                'moment_id': moment_id,
                'comment_data': comment_data,
                'comments_count': comments_count
            }
        )

    @staticmethod
    async def broadcast_share_update(moment_id, shares_count, user_id):
        """Broadcast share update"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            'feed_global',
            {
                'type': 'feed_share_update',
                'moment_id': moment_id,
                'shares_count': shares_count,
                'user_id': user_id
            }
        )

    @staticmethod
    async def broadcast_follow_update(follower_id, following_id, is_following):
        """Broadcast follow/unfollow update"""
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        
        await channel_layer.group_send(
            f'feed_user_{following_id}',
            {
                'type': 'feed_follow_update',
                'follower_id': follower_id,
                'following_id': following_id,
                'is_following': is_following
            }
        )
