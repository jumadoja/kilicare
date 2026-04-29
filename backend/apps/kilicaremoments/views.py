from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from .models import *
from .serializers import *
from .permissions import IsAdmin
from core.services.moments_service import CreateMomentService, LikeMomentService, CommentMomentService

# =====================
# MOMENTS
# =====================
class MomentViewSet(viewsets.ModelViewSet):
    """Comprehensive Moments API with feed, filtering, and engagement"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['media_type', 'visibility', 'is_featured', 'posted_by']
    search_fields = ['caption', 'location', 'posted_by__username']
    ordering_fields = ['created_at', 'trending_score', 'views']
    ordering = ['-trending_score', '-created_at']

    def get_queryset(self):
        """Filter queryset based on user permissions and request parameters"""
        user = self.request.user
        queryset = KilicareMoment.objects.filter(
            is_hidden=False
        ).select_related('posted_by').prefetch_related('likes', 'comments')
        
        # Filter by visibility
        if not user.is_staff:
            queryset = queryset.filter(
                Q(visibility='PUBLIC') |
                Q(visibility='FOLLOWERS', posted_by__in=user.following.values('following')) |
                Q(posted_by=user)
            )
        
        # Location-based filtering
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 10)  # Default 10km
        
        if lat and lng:
            from django.db.models import ExpressionWrapper, FloatField
            from math import radians, cos, sin, asin, sqrt
            
            # Simple distance calculation (can be optimized with PostGIS)
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
            return MomentCreateSerializer
        elif self.action == 'list':
            return MomentListSerializer
        return MomentSerializer

    def perform_create(self, serializer):
        # Use service layer for moment creation
        service = CreateMomentService(
            user=self.request.user,
            caption=serializer.validated_data.get('caption'),
            media_type=serializer.validated_data.get('media_type'),
            media_file=serializer.validated_data.get('media_file'),
            visibility=serializer.validated_data.get('visibility', 'PUBLIC'),
            latitude=serializer.validated_data.get('latitude'),
            longitude=serializer.validated_data.get('longitude')
        )
        moment = service.execute()
        serializer.instance = moment
        return moment

    def retrieve(self, request, *args, **kwargs):
        """Track views when retrieving a moment"""
        instance = self.get_object()
        # Increment view count
        KilicareMoment.objects.filter(id=instance.id).update(views=F('views') + 1)
        # Recalculate trending score
        instance.calculate_trending_score()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like or unlike a moment"""
        moment = self.get_object()
        
        # Use service layer for liking
        service = LikeMomentService(user=request.user, moment_id=moment.id)
        result = service.execute()
        
        if result['status'] == 'unliked':
            return Response({'status': 'unliked', 'is_liked': False})
        else:
            return Response({'status': 'liked', 'is_liked': True})

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """Add comment to a moment"""
        moment = self.get_object()
        comment_text = request.data.get('comment', '').strip()
        
        if not comment_text:
            return Response(
                {'error': 'Comment cannot be empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use service layer for commenting
        service = CommentMomentService(user=request.user, moment_id=moment.id, comment_text=comment_text)
        comment = service.execute()
        
        return Response(CommentSerializer(comment).data)

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        """Save or unsave a moment"""
        moment = self.get_object()
        saved, created = SavedMoment.objects.get_or_create(user=request.user, moment=moment)
        
        if not created:
            # Unsave if already saved
            saved.delete()
            return Response({'status': 'unsaved', 'is_saved': False})
        else:
            return Response({'status': 'saved', 'is_saved': True})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Track moment sharing"""
        moment = self.get_object()
        KilicareMoment.objects.filter(id=moment.id).update(shares=F('shares') + 1)
        moment.calculate_trending_score()
        
        # Award points for sharing
        if hasattr(request.user, 'passport'):
            request.user.passport.add_points(5)
        
        return Response({'status': 'shared', 'shares_count': moment.shares + 1})

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """Get personalized feed for the user"""
        user = request.user
        
        # Get moments from people user follows + featured moments
        feed_queryset = KilicareMoment.objects.filter(
            Q(is_hidden=False) & (
                Q(posted_by__in=user.following.values('following')) |
                Q(is_featured=True) |
                Q(posted_by=user)
            )
        ).select_related('posted_by').prefetch_related('likes', 'comments')
        
        page = self.paginate_queryset(feed_queryset)
        if page is not None:
            serializer = MomentListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = MomentListSerializer(feed_queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending moments"""
        trending_queryset = KilicareMoment.objects.filter(
            is_hidden=False,
            visibility='PUBLIC'
        ).filter(
            # Filter for recent content (last 24 hours)
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).order_by('-trending_score', '-created_at')
        
        page = self.paginate_queryset(trending_queryset)
        if page is not None:
            serializer = MomentListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = MomentListSerializer(trending_queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_moments(self, request):
        """Get current user's moments"""
        my_moments = KilicareMoment.objects.filter(
            posted_by=request.user
        ).select_related('posted_by').prefetch_related('likes', 'comments')
        
        page = self.paginate_queryset(my_moments)
        if page is not None:
            serializer = MomentSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = MomentSerializer(my_moments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def saved(self, request):
        """Get user's saved moments"""
        saved_moments = SavedMoment.objects.filter(
            user=request.user
        ).select_related('moment', 'moment__posted_by')
        
        moments = [saved.moment for saved in saved_moments]
        page = self.paginate_queryset(moments)
        if page is not None:
            serializer = MomentListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = MomentListSerializer(moments, many=True, context={'request': request})
        return Response(serializer.data)

# =====================
# FOLLOW SYSTEM
# =====================
class FollowViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Follow.objects.all()

    def create(self, request):
        Follow.objects.get_or_create(
            follower=request.user,
            following_id=request.data.get('user_id')
        )
        return Response({'status': 'followed'})

    @action(detail=False, methods=['post'])
    def unfollow(self, request):
        """Unfollow a user"""
        user_id = request.data.get('user_id')
        try:
            follow = Follow.objects.get(
                follower=request.user,
                following_id=user_id
            )
            follow.delete()
            return Response({'status': 'unfollowed'})
        except Follow.DoesNotExist:
            return Response(
                {'error': 'Not following this user'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def following(self, request):
        """Get users that current user is following"""
        following = Follow.objects.filter(
            follower=request.user
        ).select_related('following')
        
        users = [follow.following for follow in following]
        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def followers(self, request):
        """Get users that follow current user"""
        followers = Follow.objects.filter(
            following=request.user
        ).select_related('follower')
        
        users = [follow.follower for follow in followers]
        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)

# =====================
# MUSIC
# =====================
class MusicViewSet(viewsets.ModelViewSet):
    queryset = BackgroundMusic.objects.all()
    serializer_class = MusicSerializer
    permission_classes = [IsAuthenticated]

# =====================
# ADMIN
# =====================
class AdminMomentViewSet(viewsets.ModelViewSet):
    queryset = KilicareMoment.objects.all()
    serializer_class = MomentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        moment = self.get_object()
        moment.is_verified = True
        moment.save()
        AdminActionLog.objects.create(
            admin=request.user,
            action='Approved moment',
            target_moment=moment,
            target_user=moment.posted_by
        )
        return Response({'status': 'approved'})
