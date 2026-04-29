from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SOSAlert, SOSResponse

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for SOS responses"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role']

class SOSAlertSerializer(serializers.ModelSerializer):
    user_info = UserMinimalSerializer(source='user', read_only=True)
    responder_count = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()
    is_responded_by_current_user = serializers.SerializerMethodField()
    
    class Meta:
        model = SOSAlert
        fields = [
            'id', 'user_info', 'latitude', 'longitude', 'location_address',
            'severity', 'status', 'message', 'responder_count', 'responses',
            'is_responded_by_current_user', 'created_at', 'resolved_at', 'metadata'
        ]
        read_only_fields = ['id', 'created_at', 'resolved_at']
    
    def get_responder_count(self, obj):
        return obj.responders.count()
    
    def get_responses(self, obj):
        """Get all responses for this alert"""
        responses = obj.responses.all().select_related('responder')
        return SOSResponseSerializer(responses, many=True).data
    
    def get_is_responded_by_current_user(self, obj):
        """Check if current user has responded to this alert"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.responders.filter(id=request.user.id).exists()
        return False

class SOSAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating SOS alerts"""
    class Meta:
        model = SOSAlert
        fields = [
            'latitude', 'longitude', 'location_address',
            'severity', 'message', 'metadata'
        ]
    
    def validate_severity(self, value):
        """Validate severity is one of the allowed choices"""
        allowed_choices = [choice[0] for choice in SOSAlert.SEVERITY_CHOICES]
        if value not in allowed_choices:
            raise serializers.ValidationError(f"Severity must be one of: {allowed_choices}")
        return value

class SOSResponseSerializer(serializers.ModelSerializer):
    responder_info = UserMinimalSerializer(source='responder', read_only=True)
    
    class Meta:
        model = SOSResponse
        fields = ['id', 'alert', 'responder_info', 'message', 'is_onsite', 'created_at']
        read_only_fields = ['id', 'created_at']

class SOSResponseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating SOS responses"""
    class Meta:
        model = SOSResponse
        fields = ['alert', 'message', 'is_onsite']
    
    def validate(self, attrs):
        """Ensure user hasn't already responded to this alert"""
        request = self.context.get('request')
        alert = attrs['alert']
        
        if request and request.user.is_authenticated:
            if SOSResponse.objects.filter(alert=alert, responder=request.user).exists():
                raise serializers.ValidationError("You have already responded to this alert")
        
        return attrs

class SOSAlertListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    user_info = UserMinimalSerializer(source='user', read_only=True)
    responder_count = serializers.SerializerMethodField()
    time_since_creation = serializers.SerializerMethodField()
    
    class Meta:
        model = SOSAlert
        fields = [
            'id', 'user_info', 'latitude', 'longitude', 'location_address',
            'severity', 'status', 'responder_count', 'time_since_creation',
            'created_at'
        ]
    
    def get_responder_count(self, obj):
        return obj.responders.count()
    
    def get_time_since_creation(self, obj):
        """Get human-readable time since creation"""
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < datetime.timedelta(minutes=1):
            return "Just now"
        elif diff < datetime.timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < datetime.timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
