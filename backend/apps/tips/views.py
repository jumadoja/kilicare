from rest_framework import generics, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q, F, Count, Avg
from django.db.models import ExpressionWrapper, FloatField
from math import radians, cos, sin, asin, sqrt
from django.utils import timezone
import datetime

from .models import Tip, TipUpvote, TipReport
from .serializers import TipCreateSerializer, TipListSerializer, TipSerializer, TipUpvoteSerializer
from core.services.tips_service import CreateTipService, VoteTipService

# ================= PERMISSIONS =================
class IsLocalUser(BasePermission):
    """
    Ruhusa Maalum: Ni watumiaji wenye role ya 'local' pekee 
    ndio wanaoweza kutengeneza (create) tips mpya.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, "role") and 
            request.user.role == "local"
        )


# ================= VIEWS =================

class CreateTipView(generics.CreateAPIView):
    """
    Endpoint kwa ajili ya 'Locals' kupost tips mpya (Safety, Food, Culture n.k).
    """
    serializer_class = TipCreateSerializer
    # Lazima awe amelogin NA awe ni 'local'
    permission_classes = [IsAuthenticated, IsLocalUser]

    def perform_create(self, serializer):
        # Use service layer for tip creation
        service = CreateTipService(
            user=self.request.user,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description'),
            category=serializer.validated_data.get('category'),
            location=serializer.validated_data.get('location'),
            location_address=serializer.validated_data.get('location_address')
        )
        tip = service.execute()
        serializer.instance = tip


class ListTipsView(generics.ListAPIView):
    """
    Endpoint kwa ajili ya Tourists na Locals kuona tips zote.
    Inaleta tips ambazo ziko public tu, kuanzia mpya.
    """
    serializer_class = TipListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Kuleta data zote ambazo ni public na kupanga kwa kuanzia mpya
        queryset = Tip.objects.filter(is_public=True).order_by("-created_at")
        
        # (Bonus iliyoenda shule): Kama ukitaka kuchuja kwa category baadaye kwenye frontend
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__iexact=category)
            
        return queryset


class TipViewSet(viewsets.ModelViewSet):
    """Comprehensive Tips API with geo-filtering and ranking"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'created_by']
    search_fields = ['title', 'description', 'location_address']
    ordering_fields = ['trust_score', 'upvotes', 'created_at']
    ordering = ['-trust_score', '-created_at']

    def get_queryset(self):
        """Filter queryset based on user permissions and location with optimization"""
        user = self.request.user
        
        # Use optimized base queryset with proper indexes
        queryset = Tip.objects.filter(
            is_public=True,
            is_hidden=False
        ).select_related(
            'created_by__passport'
        ).prefetch_related(
            'upvote_records',
            'report_records'
        ).order_by('-trust_score', '-created_at')
        
        # OPTIMIZED: Role-based filtering without inefficient union
        if user.role == 'TOURIST':
            # Tourists see all public tips (already filtered above)
            pass
        elif user.role == 'LOCAL':
            # Locals see all public tips plus their own hidden tips
            # Use Q objects for better performance
            from django.db.models import Q
            queryset = queryset | Q(created_by=user)
        # Admins see all tips (already filtered above)
        
        # OPTIMIZED: Remove problematic caching for now
        # Cache should be implemented at serializer level, not queryset level
        from django.core.cache import cache
        cache_key = f"tips_queryset_{user.id}_{user.role}"
        cached_queryset = cache.get(cache_key)
        if cached_queryset is not None:
            return cached_queryset
            
        # Cache for 5 minutes
        cache.set(cache_key, list(queryset), 300)
        
        # Location-based filtering
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 25)
        
        if lat and lng:
            try:
                lat_float = float(lat)
                lng_float = float(lng)
                radius_float = float(radius)
                
                # Calculate distance for location-based filtering
                queryset = queryset.annotate(
                    distance=ExpressionWrapper(
                        6371 * 2 * asin(
                            sqrt(
                                sin(radians(F('latitude') - lat_float) / 2) ** 2 +
                                cos(radians(lat_float)) * cos(radians(F('latitude'))) *
                                sin(radians(F('longitude') - lng_float) / 2) ** 2
                            )
                        ),
                        output_field=FloatField()
                    )
                ).filter(distance__lte=radius_float)
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': 'Invalid coordinates or radius'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TipCreateSerializer
        elif self.action == 'list':
            return TipListSerializer
        return TipSerializer

    def perform_create(self, serializer):
        """Create tip using service layer"""
        # Use service layer for tip creation
        service = CreateTipService(
            user=self.request.user,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description'),
            category=serializer.validated_data.get('category'),
            location=serializer.validated_data.get('location'),
            location_address=serializer.validated_data.get('location_address')
        )
        tip = service.execute()
        serializer.instance = tip
        return tip

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        """Upvote or remove upvote from a tip"""
        tip = self.get_object()
        
        # Check if already upvoted and prevent self-upvoting
        if tip.created_by == request.user:
            return Response(
                {'error': 'Cannot upvote your own tip'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use service layer for voting
        existing_upvote = TipUpvote.objects.filter(
            user=request.user,
            tip=tip
        ).first()
        
        vote_type = 'upvote' if not existing_upvote else 'remove_upvote'  # Will be handled by service logic
        
        service = VoteTipService(user=request.user, tip_id=tip.id, vote_type=vote_type)
        updated_tip = service.execute()
        
        return Response({
            'status': 'upvoted' if vote_type == 'upvote' else 'upvote_removed',
            'upvotes': updated_tip.upvotes,
            'is_upvoted': True if vote_type == 'upvote' else False
        })

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        """Report a tip for moderation"""
        tip = self.get_object()
        
        # Check if already reported
        existing_report = TipReport.objects.filter(
            user=request.user,
            tip=tip
        ).first()
        
        if existing_report:
            return Response(
                {'error': 'You have already reported this tip'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'INACCURATE')
        description = request.data.get('description', '')
        
        # Create report
        TipReport.objects.create(
            user=request.user,
            tip=tip,
            reason=reason,
            description=description
        )
        
        # Update report count
        tip.reports += 1
        tip.save()
        
        # Auto-hide if too many reports
        if tip.reports >= 5:
            tip.is_hidden = True
            tip.save()
        
        # Recalculate trust score
        tip.calculate_trust_score()
        
        return Response({
            'status': 'reported',
            'reports': tip.reports
        })

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get tips near user's location"""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 25)
        category = request.query_params.get('category')
        
        if not lat or not lng:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get nearby tips
        nearby_tips = self.get_queryset().filter(
            Q(category=category) if category else Q()
        )
        
        page = self.paginate_queryset(nearby_tips)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(nearby_tips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending tips (high engagement, recent)"""
        trending_tips = Tip.objects.filter(
            is_public=True,
            is_hidden=False,
            created_at__gte=timezone.now() - datetime.timedelta(days=7)
        ).filter(
            upvotes__gte=3  # At least 3 upvotes
        ).order_by('-trust_score', '-upvotes', '-created_at')
        
        page = self.paginate_queryset(trending_tips)
        if page is not None:
            serializer = TipListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TipListSerializer(trending_tips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_tips(self, request):
        """Get current user's tips"""
        my_tips = Tip.objects.filter(
            created_by=request.user
        ).select_related('created_by').prefetch_related('upvote_records', 'report_records')
        
        page = self.paginate_queryset(my_tips)
        if page is not None:
            serializer = TipSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = TipSerializer(my_tips, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available tip categories with counts"""
        categories = Tip.objects.filter(
            is_public=True,
            is_hidden=False
        ).values('category').annotate(
            count=Count('id'),
            avg_trust_score=Avg('trust_score')
        ).order_by('-count')
        
        return Response(list(categories))

    @action(detail=False, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a tip (admin only)"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can verify tips'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tip_id = request.data.get('tip_id')
        if not tip_id:
            return Response(
                {'error': 'tip_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tip = Tip.objects.get(id=tip_id)
            tip.is_verified = True
            tip.save()
            
            # Award points to tip creator
            if hasattr(tip.created_by, 'passport'):
                tip.created_by.passport.add_points(
                    points=10,
                    transaction_type='VERIFICATION',
                    description=f'Tip verified: {tip.title}',
                    metadata={'tip_id': tip.id}
                )
            
            # Recalculate trust score
            tip.calculate_trust_score()
            
            return Response({
                'status': 'verified',
                'tip_id': tip.id
            })
        except Tip.DoesNotExist:
            return Response(
                {'error': 'Tip not found'},
                status=status.HTTP_404_NOT_FOUND
            )

# Keep the existing views for backward compatibility
class UpvoteTipView(APIView):
    """
    Legacy endpoint kwa ajili ya ku-like/upvote tip. 
    Hii inaongeza engagement kwa tourists.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, tip_id):
        # Tunatafuta tip husika, kama haipo tunatupa 404
        tip = get_object_or_404(Tip, id=tip_id, is_public=True)
        
        # Check if already upvoted
        existing_upvote = TipUpvote.objects.filter(
            user=request.user,
            tip=tip
        ).first()
        
        if existing_upvote:
            return Response(
                {'error': 'Already upvoted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add upvote
        TipUpvote.objects.create(user=request.user, tip=tip)
        tip.upvotes += 1
        tip.save()
        
        # Award points for engagement
        if hasattr(request.user, 'passport'):
            request.user.passport.add_points(
                points=2,
                transaction_type='TIP_UPVOTED',
                description=f'Upvoted tip: {tip.title}',
                metadata={'tip_id': tip.id}
            )
        
        return Response({
            "message": "Tip upvoted successfully!",
            "tip_id": tip.id,
            "new_upvotes": tip.upvotes
        }, status=status.HTTP_200_OK)