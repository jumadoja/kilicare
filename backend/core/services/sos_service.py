from django.db import transaction
from .base_service import BaseService
from ..exceptions import ValidationError, NotFoundError

class CreateAlertService(BaseService):
    """Service for creating SOS alerts"""
    
    def execute(self, user, message, severity='HIGH', latitude=None, longitude=None, location_address=None):
        """
        Create an SOS alert with location tracking and point awarding
        """
        if not message or len(message.strip()) == 0:
            raise ValidationError("Message is required")
        
        if severity not in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']:
            raise ValidationError("Invalid severity level")
        
        with transaction.atomic():
            from apps.sos.models import SOSAlert
            from apps.passport.models import PassportProfile
            
            # Create alert
            alert = SOSAlert.objects.create(
                user=user,
                message=message,
                severity=severity,
                latitude=latitude,
                longitude=longitude,
                location_address=location_address
            )
            
            # Award points for creating alert (emergency situations)
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=5,
                transaction_type='SOS_ALERT_CREATED',
                description='Created SOS alert',
                metadata={'alert_id': alert.id}
            )
            
            return alert


class RespondToAlertService(BaseService):
    """Service for responding to SOS alerts"""
    
    def execute(self, alert, responder, response_text, eta_minutes=None):
        """
        Respond to an SOS alert with point awarding
        """
        if alert.status == 'RESOLVED':
            raise ValidationError("This alert has already been resolved")
        
        if alert.responders.filter(id=responder.id).exists():
            raise ValidationError("You have already responded to this alert")
        
        with transaction.atomic():
            from apps.sos.models import SOSResponse
            from apps.passport.models import PassportProfile
            
            # Create response
            response = SOSResponse.objects.create(
                alert=alert,
                responder=responder,
                response_text=response_text,
                eta_minutes=eta_minutes
            )
            
            # Update alert status
            alert.responders.add(responder)
            if alert.status == 'ACTIVE':
                alert.status = 'RESPONDING'
            alert.save()
            
            # Award points for responding to emergency
            passport, _ = PassportProfile.objects.get_or_create(user=responder)
            passport.add_points(
                points=10,
                transaction_type='SOS_RESPONSE',
                description='Responded to SOS alert',
                metadata={'alert_id': alert.id}
            )
            
            return response
