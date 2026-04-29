from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.utils import timezone
from django.db.models import ExpressionWrapper, FloatField
from math import radians, cos, sin, asin, sqrt
from .models import SOSAlert, SOSResponse
from .serializers import (
    SOSAlertSerializer, SOSAlertCreateSerializer, SOSResponseSerializer,
    SOSResponseCreateSerializer, SOSAlertListSerializer
)
from core.services.sos_service import CreateAlertService, RespondToAlertService

class SOSAlertViewSet(viewsets.ModelViewSet):
    """Comprehensive SOS Alert API with location filtering and real-time integration"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'severity', 'user']
    search_fields = ['message', 'location_address', 'user__username']
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter queryset based on user role and request parameters"""
        user = self.request.user
        queryset = SOSAlert.objects.select_related('user').prefetch_related('responders', 'responses')
        
        # Role-based filtering
        if user.role == 'TOURIST':
            # Tourists can only see their own alerts and resolved/public alerts
            queryset = queryset.filter(
                Q(user=user) | Q(status='RESOLVED')
            )
        elif user.role == 'LOCAL':
            # Locals can see all active alerts in their area
            queryset = queryset.filter(
                Q(status__in=['ACTIVE', 'RESPONDING'])
            )
        # Admins can see all alerts
        
        # Location-based filtering
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 50)  # Default 50km for SOS
        
        if lat and lng and user.role in ['LOCAL', 'ADMIN']:
            # Calculate distance for location-based filtering
            queryset = queryset.annotate(
                distance=ExpressionWrapper(
                    6371 * 2 * asin(
                        sqrt(
                            sin(radians(F('latitude') - float(lat)) / 2) ** 2 +
                            cos(radians(float(lat))) * cos(radians(F('latitude'))) *
                            sin(radians(F('longitude') - float(lng)) / 2) ** 2
                        )
                    ),
                    output_field=FloatField()
                )
            ).filter(distance__lte=radius)
        
        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return SOSAlertCreateSerializer
        elif self.action == 'list':
            return SOSAlertListSerializer
        return SOSAlertSerializer

    def perform_create(self, serializer):
        """Create SOS alert and award points for emergency response"""
        # Use service layer for alert creation
        service = CreateAlertService(
            user=self.request.user,
            message=serializer.validated_data.get('message'),
            severity=serializer.validated_data.get('severity', 'HIGH'),
            latitude=serializer.validated_data.get('latitude'),
            longitude=serializer.validated_data.get('longitude'),
            location_address=serializer.validated_data.get('location_address')
        )
        alert = service.execute()
        serializer.instance = alert
        return alert
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to an SOS alert with detailed response"""
        alert = self.get_object()
        
        if alert.status == 'RESOLVED':
            return Response(
                {'error': 'This alert has already been resolved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only locals and admins can respond
        if request.user.role not in ['LOCAL', 'ADMIN']:
            return Response(
                {'error': 'Only locals and admins can respond to SOS alerts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already responded
        if alert.responders.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You have already responded to this alert'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use serializer for validation
        serializer = SOSResponseCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Use service layer for response creation
        service = RespondToAlertService(
            alert=alert,
            responder=request.user,
            response_text=serializer.validated_data.get('response_text'),
            eta_minutes=serializer.validated_data.get('eta_minutes')
        )
        response = service.execute()
        
        return Response(
            SOSResponseSerializer(response, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an SOS alert with optional resolution notes"""
        alert = self.get_object()
        
        # Only the alert creator or admin can resolve
        if alert.user != request.user and request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only the alert creator or admin can resolve this alert'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        resolution_notes = request.data.get('resolution_notes', '')
        
        # Update alert
        alert.resolve()
        
        # Add resolution notes to metadata
        if resolution_notes:
            alert.metadata['resolution_notes'] = resolution_notes
            alert.metadata['resolved_by'] = request.user.id
            alert.metadata['resolved_by_name'] = request.user.username
            alert.save()
        
        # Award points for resolving emergency
        if hasattr(request.user, 'passport'):
            request.user.passport.add_points(20)
        
        return Response({
            'status': 'resolved',
            'resolved_at': alert.resolved_at,
            'resolution_notes': resolution_notes
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an SOS alert"""
        alert = self.get_object()
        
        # Only the alert creator can cancel
        if alert.user != request.user:
            return Response(
                {'error': 'Only the alert creator can cancel this alert'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if alert.status == 'RESOLVED':
            return Response(
                {'error': 'Cannot cancel a resolved alert'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.status = 'CANCELLED'
        alert.save()
        return Response({'status': 'cancelled'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get nearby SOS alerts based on user location"""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 50)
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get nearby active alerts
        nearby_alerts = self.get_queryset().filter(
            status__in=['ACTIVE', 'RESPONDING']
        )
        
        # Apply distance calculation
        nearby_alerts = nearby_alerts.annotate(
            distance=ExpressionWrapper(
                6371 * 2 * asin(
                    sqrt(
                        sin(radians(F('latitude') - float(lat)) / 2) ** 2 +
                        cos(radians(float(lat))) * cos(radians(F('latitude'))) *
                        sin(radians(F('longitude') - float(lng)) / 2) ** 2
                    )
                ),
                output_field=FloatField()
            )
        ).filter(distance__lte=radius).order_by('distance', '-created_at')
        
        page = self.paginate_queryset(nearby_alerts)
        if page is not None:
            serializer = SOSAlertListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = SOSAlertListSerializer(nearby_alerts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_alerts(self, request):
        """Get current user's SOS alerts"""
        my_alerts = SOSAlert.objects.filter(
            user=request.user
        ).select_related('user').prefetch_related('responders', 'responses')
        
        page = self.paginate_queryset(my_alerts)
        if page is not None:
            serializer = SOSAlertSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = SOSAlertSerializer(my_alerts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get SOS statistics (admin and locals only)"""
        if request.user.role not in ['LOCAL', 'ADMIN']:
            return Response(
                {'error': 'Only locals and admins can view SOS statistics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.db.models import Count, Q
        from django.utils import timezone
        import datetime
        
        # Time ranges
        now = timezone.now()
        last_24h = now - datetime.timedelta(hours=24)
        last_7d = now - datetime.timedelta(days=7)
        
        stats = {
            'total_alerts': SOSAlert.objects.count(),
            'active_alerts': SOSAlert.objects.filter(status='ACTIVE').count(),
            'responding_alerts': SOSAlert.objects.filter(status='RESPONDING').count(),
            'resolved_alerts': SOSAlert.objects.filter(status='RESOLVED').count(),
            'last_24_hours': SOSAlert.objects.filter(created_at__gte=last_24h).count(),
            'last_7_days': SOSAlert.objects.filter(created_at__gte=last_7d).count(),
            'by_severity': dict(
                SOSAlert.objects.values('severity')
                .annotate(count=Count('id'))
                .values_list('severity', 'count')
            ),
            'response_rate': 0.0  # Will be calculated
        }
        
        # Calculate response rate
        total_alerts_needing_response = SOSAlert.objects.filter(
            status__in=['ACTIVE', 'RESPONDING', 'RESOLVED']
        ).count()
        responded_alerts = SOSAlert.objects.filter(
            status__in=['RESPONDING', 'RESOLVED']
        ).exclude(responders__isnull=True).distinct().count()
        
        if total_alerts_needing_response > 0:
            stats['response_rate'] = round(
                (responded_alerts / total_alerts_needing_response) * 100, 2
            )
        
        return Response(stats)

class SOSResponseViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SOSResponseSerializer
    
    def get_queryset(self):
        alert_id = self.request.query_params.get('alert')
        queryset = SOSResponse.objects.all()
        
        if alert_id:
            queryset = queryset.filter(alert_id=alert_id)
            
        return queryset.select_related('alert', 'responder')
