import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import SOSAlert, SOSResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import jwt

User = get_user_model()

class SOSConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Authenticate using query parameter token
        self.user = await self.get_user_from_token()
        
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # 2. SOS CHANNEL SETUP
        # Join general SOS channel for all emergency broadcasts
        self.sos_group_name = 'sos_alerts'
        self.user_id = str(self.user.id) if self.user and not self.user.is_anonymous else None
        
        # Join role-specific channel
        if self.user.role == 'LOCAL':
            self.role_group_name = 'sos_locals'
        elif self.user.role == 'ADMIN':
            self.role_group_name = 'sos_admins'
        else:
            self.role_group_name = None

        await self.channel_layer.group_add(self.sos_group_name, self.channel_name)
        
        if self.role_group_name:
            await self.channel_layer.group_add(self.role_group_name, self.channel_name)
        
        await self.accept()

        # 3. STATUS UPDATE
        await self.channel_layer.group_send(
            self.sos_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'username': self.user.username,
                'role': self.user.role,
                'status': 'online'
            }
        )

    @database_sync_to_async
    def get_user_from_token(self):
        """Authenticate user from query parameter token."""
        try:
            # Extract token from query parameters
            query_string = self.scope.get('query_string', b'').decode()
            query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = query_params.get('token')
            
            if not token:
                return User.objects.get_or_create(username='anonymous')[0]  # Return anonymous user
            
            # Decode JWT using SECRET_KEY
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if user_id:
                return User.objects.get(id=user_id)
            return User.objects.get_or_create(username='anonymous')[0]  # Return anonymous user
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            return User.objects.get_or_create(username='anonymous')[0]  # Return anonymous user

    async def disconnect(self, close_code):
        if hasattr(self, 'sos_group_name'):
            await self.channel_layer.group_send(
                self.sos_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'role': self.user.role,
                    'status': 'offline'
                }
            )
            
            await self.channel_layer.group_discard(self.sos_group_name, self.channel_name)
        if hasattr(self, 'role_group_name') and self.role_group_name:
            await self.channel_layer.group_discard(self.role_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action', 'alert')

        if action == 'trigger_alert':
            await self.handle_trigger_alert(data)
        elif action == 'respond_to_alert':
            await self.handle_respond_to_alert(data)
        elif action == 'update_alert_status':
            await self.handle_update_alert_status(data)
        elif action == 'location_update':
            await self.handle_location_update(data)

    async def handle_trigger_alert(self, data):
        """Handle new SOS alert creation"""
        if self.user.role not in ['TOURIST', 'LOCAL']:
            await self.send_error("Only users can trigger SOS alerts")
            return

        alert_data = await self.create_sos_alert(data)
        
        # Broadcast to all relevant channels
        await self.channel_layer.group_send(
            self.sos_group_name,
            {
                'type': 'sos_alert_broadcast',
                'action': 'new_alert',
                'alert': alert_data
            }
        )

        # Send specific notification to locals and admins
        if self.role_group_name:
            await self.channel_layer.group_send(
                self.role_group_name,
                {
                    'type': 'sos_alert_broadcast',
                    'action': 'new_alert_priority',
                    'alert': alert_data
                }
            )

    async def handle_respond_to_alert(self, data):
        """Handle response to SOS alert"""
        alert_id = data.get('alert_id')
        response_message = data.get('message', '')
        is_onsite = data.get('is_onsite', False)

        if self.user.role not in ['LOCAL', 'ADMIN']:
            await self.send_error("Only locals and admins can respond to alerts")
            return

        response_data = await self.create_sos_response(alert_id, response_message, is_onsite)
        
        # Broadcast response to all in SOS channel
        await self.channel_layer.group_send(
            self.sos_group_name,
            {
                'type': 'sos_response_broadcast',
                'action': 'new_response',
                'alert_id': alert_id,
                'response': response_data
            }
        )

    async def handle_update_alert_status(self, data):
        """Handle alert status updates"""
        alert_id = data.get('alert_id')
        new_status = data.get('status')

        if self.user.role not in ['LOCAL', 'ADMIN']:
            await self.send_error("Only locals and admins can update alert status")
            return

        updated = await self.update_alert_status(alert_id, new_status)
        
        if updated:
            await self.channel_layer.group_send(
                self.sos_group_name,
                {
                    'type': 'sos_status_update',
                    'action': 'status_updated',
                    'alert_id': alert_id,
                    'status': new_status,
                    'updated_by': self.user.id,
                    'updated_by_name': self.user.username
                }
            )

    async def handle_location_update(self, data):
        """Handle real-time location updates during emergency"""
        alert_id = data.get('alert_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        # Broadcast location update to responders
        await self.channel_layer.group_send(
            self.sos_group_name,
            {
                'type': 'sos_location_update',
                'action': 'location_updated',
                'alert_id': alert_id,
                'latitude': latitude,
                'longitude': longitude,
                'updated_by': self.user.id,
                'timestamp': timezone.now().isoformat()
            }
        )

    # --- HANDLERS ---
    async def sos_alert_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    async def sos_response_broadcast(self, event):
        await self.send(text_data=json.dumps(event))

    async def sos_status_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def sos_location_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_status(self, event):
        await self.send(text_data=json.dumps(event))

    # --- DATABASE METHODS ---
    @database_sync_to_async
    def create_sos_alert(self, data):
        # Input validation
        try:
            latitude = float(data.get('latitude', 0))
            longitude = float(data.get('longitude', 0))
            if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                return {'error': 'Invalid coordinates'}
        except (ValueError, TypeError):
            return {'error': 'Invalid coordinate format'}
        
        # Rate limiting check (max 1 SOS per 5 minutes)
        from django.utils import timezone
        from datetime import timedelta
        
        recent_alerts = SOSAlert.objects.filter(
            user=self.user,
            created_at__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        if recent_alerts >= 3:  # Max 3 alerts per 5 minutes
            return {'error': 'Too many SOS alerts. Please wait before creating another.'}
        
        alert = SOSAlert.objects.create(
            user=self.user,
            latitude=latitude,
            longitude=longitude,
            location_address=data.get('location_address', ''),
            severity=data.get('severity', 'HIGH'),
            message=data.get('message', ''),
            metadata=data.get('metadata', {})
        )
        
        return {
            'id': alert.id,
            'user_id': alert.user.id,
            'username': alert.user.username,
            'latitude': float(alert.latitude),
            'longitude': float(alert.longitude),
            'location_address': alert.location_address,
            'severity': alert.severity,
            'status': alert.status,
            'message': alert.message,
            'created_at': alert.created_at.isoformat(),
            'metadata': alert.metadata
        }

    @database_sync_to_async
    def create_sos_response(self, alert_id, message, is_onsite):
        try:
            alert = SOSAlert.objects.get(id=alert_id)
            response, created = SOSResponse.objects.get_or_create(
                alert=alert,
                responder=self.user,
                defaults={
                    'message': message,
                    'is_onsite': is_onsite
                }
            )
            
            if not created:
                response.message = message
                response.is_onsite = is_onsite
                response.save()
            
            # Add responder to alert
            alert.responders.add(self.user)
            
            return {
                'id': response.id,
                'alert_id': alert_id,
                'responder_id': self.user.id,
                'responder_name': self.user.username,
                'responder_role': self.user.role,
                'message': response.message,
                'is_onsite': response.is_onsite,
                'created_at': response.created_at.isoformat()
            }
        except SOSAlert.DoesNotExist:
            return None

    @database_sync_to_async
    def update_alert_status(self, alert_id, new_status):
        try:
            alert = SOSAlert.objects.get(id=alert_id)
            if new_status in ['ACTIVE', 'RESPONDING', 'RESOLVED', 'CANCELLED']:
                alert.status = new_status
                if new_status == 'RESOLVED':
                    alert.resolved_at = timezone.now()
                alert.save()
                return True
        except SOSAlert.DoesNotExist:
            pass
        return False

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
