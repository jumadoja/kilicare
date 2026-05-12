from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from apps.users.views import CookieJWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from .models import *
from .serializers import MomentCreateSerializer, MusicSerializer, MomentSerializer
from .feed_serializers import FeedMomentSerializer
from .permissions import IsAdmin
from core.services.moments_service import CreateMomentService, LikeMomentService, CommentMomentService

# =====================
# MOMENTS
# =====================
class MomentViewSet(viewsets.ModelViewSet):
    """Comprehensive Moments API with feed, filtering, and engagement"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]
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
        
        # Filter by visibility - removed is_staff check for debugging
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
            from .feed_serializers import FeedMomentSerializer
            return FeedMomentSerializer
        return MomentSerializer

    def perform_create(self, serializer):
        # Use service layer for moment creation
        service = CreateMomentService()
        moment = service.execute(
            user=self.request.user,
            caption=serializer.validated_data.get('caption'),
            media_type=serializer.validated_data.get('media_type'),
            media_file=serializer.validated_data.get('media'),
            visibility=serializer.validated_data.get('visibility', 'PUBLIC'),
            latitude=serializer.validated_data.get('latitude'),
            longitude=serializer.validated_data.get('longitude'),
            background_music=serializer.validated_data.get('background_music')
        )
        serializer.instance = moment
        return moment

    def retrieve(self, request, *args, **kwargs):
        """Track views when retrieving a moment - STANDARDIZED FORMAT"""
        instance = self.get_object()
        # Increment view count
        KilicareMoment.objects.filter(id=instance.id).update(views=F('views') + 1)
        # Recalculate trending score
        instance.calculate_trending_score()
        
        # Use standardized DTO
        from .feed_serializers import FeedItemSerializer
        serializer = FeedItemSerializer(instance, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Moment retrieved successfully",
            data=serializer.data
        )

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like or unlike a moment - STANDARDIZED FORMAT"""
        moment = self.get_object()
        
        # Use service layer for liking
        service = LikeMomentService()
        result = service.execute(user=request.user, moment_id=moment.id)
        
        from core.utils.response import success_response
        if result['status'] == 'unliked':
            return success_response(
                message="Moment unliked successfully",
                data={'status': 'unliked', 'is_liked': False}
            )
        else:
            return success_response(
                message="Moment liked successfully",
                data={'status': 'liked', 'is_liked': True}
            )

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get comments or add comment to a moment - STANDARDIZED FORMAT"""
        moment = self.get_object()
        
        if request.method == 'GET':
            """Get all comments for a moment"""
            comments = MomentComment.objects.filter(moment=moment).order_by('-created_at')
            # Use standardized DTO
            from .feed_serializers import FeedCommentSerializer
            serializer = FeedCommentSerializer(comments, many=True, context={'request': request})
            from core.utils.response import success_response
            return success_response(
                message="Comments retrieved successfully",
                data={'results': serializer.data, 'count': len(serializer.data)}
            )
        
        elif request.method == 'POST':
            """Add comment to a moment"""
            comment_text = request.data.get('comment', '').strip()
            
            if not comment_text:
                from core.utils.response import error_response
                return error_response(
                    message="Comment cannot be empty",
                    errors=["Comment text is required"]
                )
            
            # Use service layer for commenting
            service = CommentMomentService()
            comment = service.execute(user=self.request.user, moment_id=moment.id, comment_text=comment_text)
            
            # Use standardized DTO
            from .feed_serializers import FeedCommentSerializer
            serializer = FeedCommentSerializer(comment, context={'request': request})
            from core.utils.response import success_response
            return success_response(
                message="Comment added successfully",
                data=serializer.data
            )

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        """Save or unsave a moment - STANDARDIZED FORMAT"""
        moment = self.get_object()
        saved, created = SavedMoment.objects.get_or_create(user=request.user, moment=moment)
        
        from core.utils.response import success_response
        if not created:
            # Unsave if already saved
            saved.delete()
            return success_response(
                message="Moment unsaved successfully",
                data={'status': 'unsaved', 'is_saved': False}
            )
        else:
            return success_response(
                message="Moment saved successfully",
                data={'status': 'saved', 'is_saved': True}
            )

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Track moment sharing - STANDARDIZED FORMAT"""
        moment = self.get_object()
        
        # Update model safely
        moment.shares += 1
        moment.save(update_fields=['shares'])
        moment.calculate_trending_score()
        
        # Award points for sharing
        if hasattr(request.user, 'passport'):
            request.user.passport.add_points(5)
        
        # Return standardized DTO response
        from .feed_serializers import FeedItemSerializer
        serializer = FeedItemSerializer(moment, context={'request': request})
        
        from core.utils.response import success_response
        return success_response(
            message="Moment shared successfully",
            data={
                'status': 'shared',
                'shares': serializer.data['moment']['shares']
            }
        )

    @action(detail=True, methods=['post'])
    def track_view(self, request, pk=None):
        """Track moment views - STANDARDIZED FORMAT"""
        moment = self.get_object()
        
        # Prevent duplicate views from same user in short time
        from django.core.cache import cache
        cache_key = f'moment_view_{request.user.id}_{moment.id}'
        if cache.get(cache_key):
            from core.utils.response import success_response
            return success_response(
                message="View already tracked",
                data={'views': moment.views}
            )
        
        # Update view count
        moment.views += 1
        moment.save(update_fields=['views'])
        
        # Cache view for 5 minutes to prevent duplicate counting
        cache.set(cache_key, True, 300)
        
        from core.utils.response import success_response
        return success_response(
            message="View tracked successfully",
            data={'views': moment.views}
        )

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """Get personalized feed for the user - STANDARDIZED FORMAT"""
        # Guard clause to ensure user is authenticated
        if not request.user.is_authenticated:
            return Response({"error": "Login required"}, status=401)
            
        user = request.user
        
        # Get moments from people user follows + featured moments
        feed_queryset = KilicareMoment.objects.filter(
            Q(is_hidden=False) & (
                Q(posted_by__in=user.following.values('following')) |
                Q(is_featured=True) |
                Q(posted_by=user)
            )
        ).select_related('posted_by').prefetch_related('likes', 'comments')
        
        # Import standardized serializers
        from .feed_serializers import FeedItemSerializer
        from core.pagination import FeedPagination
        
        # Use specialized feed pagination
        paginator = FeedPagination()
        page = paginator.paginate_queryset(feed_queryset, request)
        
        if page is not None:
            # Create FeedItemDTO structure
            serializer = FeedItemSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # Fallback - return non-paginated response
        serializer = FeedItemSerializer(feed_queryset, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Feed retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending moments - STANDARDIZED FORMAT"""
        trending_queryset = KilicareMoment.objects.filter(
            is_hidden=False,
            visibility='PUBLIC'
        ).filter(
            # Filter for recent content (last 24 hours)
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).order_by('-trending_score', '-created_at')
        
        # Use standardized pagination
        from .feed_serializers import FeedItemSerializer
        from core.pagination import FeedPagination
        
        paginator = FeedPagination()
        page = paginator.paginate_queryset(trending_queryset, request)
        
        if page is not None:
            serializer = FeedItemSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # Fallback
        serializer = FeedItemSerializer(trending_queryset, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Trending moments retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

    @action(detail=False, methods=['get'])
    def my_moments(self, request):
        """Get current user's moments - STANDARDIZED FORMAT"""
        my_moments = KilicareMoment.objects.filter(
            posted_by=request.user
        ).select_related('posted_by').prefetch_related('likes', 'comments')
        
        # Use standardized pagination and DTO
        from .feed_serializers import FeedItemSerializer
        from core.pagination import FeedPagination
        
        paginator = FeedPagination()
        page = paginator.paginate_queryset(my_moments, request)
        
        if page is not None:
            serializer = FeedItemSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # Fallback
        serializer = FeedItemSerializer(my_moments, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="User moments retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

    @action(detail=False, methods=['get'])
    def saved(self, request):
        """Get user's saved moments - STANDARDIZED FORMAT"""
        saved_moments = SavedMoment.objects.filter(
            user=request.user
        ).select_related('moment', 'moment__posted_by')
        
        moments = [saved.moment for saved in saved_moments]
        
        # Use standardized pagination and DTO
        from .feed_serializers import FeedItemSerializer
        from core.pagination import FeedPagination
        
        paginator = FeedPagination()
        page = paginator.paginate_queryset(moments, request)
        
        if page is not None:
            serializer = FeedItemSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # Fallback
        serializer = FeedItemSerializer(moments, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Saved moments retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

# =====================
# FOLLOW SYSTEM
# =====================
class FollowViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]
    queryset = Follow.objects.all()

    @action(detail=False, methods=['post'])
    def follow(self, request):
        """Follow a user - STANDARDIZED FORMAT"""
        user_id = request.data.get('user_id')
        
        if not user_id:
            from core.utils.response import error_response
            return error_response(
                message="user_id is required",
                errors=["Missing user_id in request body"]
            )
        
        Follow.objects.get_or_create(
            follower=request.user,
            following_id=user_id
        )
        from core.utils.response import success_response
        return success_response(
            message="User followed successfully",
            data={'status': 'followed'}
        )

    @action(detail=False, methods=['post'])
    def unfollow(self, request):
        """Unfollow a user - STANDARDIZED FORMAT"""
        user_id = request.data.get('user_id')
        
        if not user_id:
            from core.utils.response import error_response
            return error_response(
                message="user_id is required",
                errors=["Missing user_id in request body"]
            )
        
        try:
            follow = Follow.objects.get(
                follower=request.user,
                following_id=user_id
            )
            follow.delete()
            from core.utils.response import success_response
            return success_response(
                message="User unfollowed successfully",
                data={'status': 'unfollowed'}
            )
        except Follow.DoesNotExist:
            from core.utils.response import error_response
            return error_response(
                message="Not following this user",
                errors=["User not in following list"]
            )

    @action(detail=False, methods=['get'])
    def following(self, request):
        """Get users that current user is following - STANDARDIZED FORMAT"""
        following = Follow.objects.filter(
            follower=request.user
        ).select_related('following')
        
        users = [follow.following for follow in following]
        # Use standardized UserDTO
        from .feed_serializers import FeedUserSerializer
        serializer = FeedUserSerializer(users, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Following list retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

    @action(detail=False, methods=['get'])
    def followers(self, request):
        """Get users that follow current user - STANDARDIZED FORMAT"""
        followers = Follow.objects.filter(
            following=request.user
        ).select_related('follower')
        
        users = [follow.follower for follow in followers]
        # Use standardized UserDTO
        from .feed_serializers import FeedUserSerializer
        serializer = FeedUserSerializer(users, many=True, context={'request': request})
        from core.utils.response import success_response
        return success_response(
            message="Followers list retrieved successfully",
            data={'results': serializer.data, 'count': len(serializer.data)}
        )

# =====================
# MUSIC
# =====================
class MusicViewSet(viewsets.ModelViewSet):
    queryset = BackgroundMusic.objects.all()
    serializer_class = MusicSerializer
    permission_classes = []  # Allow unauthenticated access for now
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

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
