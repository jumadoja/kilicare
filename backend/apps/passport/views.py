from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Sum, Count
from django.core.exceptions import ValidationError
import logging
from .models import PassportProfile, PassportBadge, UserBadge, PassportActivity, PointsTransaction
from .serializers import (
    PassportProfileSerializer, PassportBadgeSerializer, UserBadgeSerializer,
    PassportActivitySerializer, PointsTransactionSerializer, PassportStatisticsSerializer,
    LeaderboardSerializer, AwardPointsSerializer, CreateActivitySerializer
)
from django.contrib.auth import get_user_model
from core.services.passport_service import AwardPointsService, UpdateTrustScoreService

User = get_user_model()
logger = logging.getLogger(__name__)

class MyPassportView(generics.RetrieveAPIView):
    serializer_class = PassportProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Ensure user has passport profile with comprehensive error handling
        try:
            if not self.request.user or self.request.user.is_anonymous:
                raise Response(status=status.HTTP_401_UNAUTHORIZED)
            
            passport, created = PassportProfile.objects.get_or_create(user=self.request.user)
            return passport
        except Exception as e:
            logger.error(f"Error creating/getting passport profile: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve passport profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserBadgesView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.badges.all()

class PassportViewSet(viewsets.ModelViewSet):
    """Comprehensive Passport API with statistics and management"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'action_type']

    def get_queryset(self):
        if self.action in ['activities', 'transactions']:
            if self.action == 'activities':
                return PassportActivity.objects.filter(user=self.request.user)
            elif self.action == 'transactions':
                return PointsTransaction.objects.filter(user=self.request.user)
        return PassportProfile.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'activities':
            return PassportActivitySerializer
        elif self.action == 'transactions':
            return PointsTransactionSerializer
        return PassportProfileSerializer

    def get_object(self):
        # Ensure user has passport profile
        passport, created = PassportProfile.objects.get_or_create(user=self.request.user)
        return passport

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive passport statistics"""
        passport = self.get_object()
        stats = passport.get_statistics()
        
        # Add additional computed data
        stats['recent_activities'] = PassportActivity.objects.filter(
            user=request.user
        ).order_by('-created_at')[:10]
        stats['badges_count'] = request.user.badges.count()
        stats['level_progress'] = {
            'current_level': passport.level,
            'current_points': passport.points,
            'next_level_points': passport.get_level_info().get('min_points', 0),
            'progress_percentage': min((passport.points / max(passport.get_level_info().get('min_points', 1), 1)) * 100, 100)
        }
        
        serializer = PassportStatisticsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def activities(self, request):
        """Get user's passport activities"""
        activities = self.get_queryset()
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """Get user's points transactions"""
        transactions = self.get_queryset()
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def award_points(self, request):
        """Award points to user (admin only)"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can award points'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AwardPointsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        points = serializer.validated_data['points']
        transaction_type = serializer.validated_data['transaction_type']
        description = serializer.validated_data.get('description', '')
        metadata = serializer.validated_data.get('metadata', {})
        
        # Validate points amount
        if points <= 0 or points > 1000:
            return Response(
                {'error': 'Points must be between 1 and 1000'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=user_id)
            
            # Use service layer for awarding points
            service = AwardPointsService(
                user=target_user,
                points=points,
                transaction_type=transaction_type,
                description=description,
                metadata=metadata
            )
            passport = service.execute()
            
            return Response({
                'message': f'Awarded {points} points to {target_user.username}',
                'new_balance': passport.points,
                'new_trust_score': passport.trust_score
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def create_activity(self, request):
        """Create a passport activity"""
        serializer = CreateActivitySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        activity = serializer.save()
        
        # Award points if specified
        if activity.points_awarded > 0:
            passport = self.get_object()
            passport.add_points(
                points=activity.points_awarded,
                transaction_type=activity.action_type,
                description=f"Activity: {activity.action_type}",
                metadata=activity.metadata
            )
        
        return Response(
            PassportActivitySerializer(activity).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get passport leaderboard"""
        limit = int(request.query_params.get('limit', 50))
        metric = request.query_params.get('metric', 'trust_score')
        
        if metric not in ['trust_score', 'points', 'level']:
            metric = 'trust_score'
        
        # Get top users by metric
        queryset = PassportProfile.objects.select_related('user').order_by(f'-{metric}')[:limit]
        
        leaderboard_data = []
        for rank, passport in enumerate(queryset, 1):
            stats = passport.get_statistics()
            
            leaderboard_data.append({
                'rank': rank,
                'user_info': {
                    'id': passport.user.id,
                    'username': passport.user.username,
                    'first_name': passport.user.first_name,
                    'last_name': passport.user.last_name,
                    'role': passport.user.role
                },
                'passport_data': PassportProfileSerializer(passport).data,
                'statistics': stats
            })
        
        return Response(leaderboard_data)

    @action(detail=False, methods=['get'])
    def badges(self, request):
        """Get available badges and user's unlocked badges"""
        available_badges = PassportBadge.objects.all()
        user_badges = request.user.badges.select_related('badge')
        
        unlocked_badge_ids = [ub.badge.id for ub in user_badges]
        
        badges_data = []
        for badge in available_badges:
            badges_data.append({
                'id': badge.id,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon.url if badge.icon else None,
                'criteria_points': badge.criteria_points,
                'is_unlocked': badge.id in unlocked_badge_ids,
                'unlocked_at': next(
                    (ub.unlocked_at for ub in user_badges if ub.badge.id == badge.id),
                    None
                )
            })
        
        return Response(badges_data)

    @action(detail=False, methods=['post'])
    def update_trust_score(self, request):
        """Manually trigger trust score recalculation (admin only)"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can update trust scores'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
                # Use service layer for trust score update
                service = UpdateTrustScoreService(user=target_user)
                passport = service.execute()
                return Response({
                    'message': f'Updated trust score for {target_user.username}',
                    'new_trust_score': passport.trust_score
                })
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Update all users' trust scores - OPTIMIZED
            # Use bulk operations and pagination for large user bases
            from django.core.paginator import Paginator
        
        paginator = Paginator(PassportProfile.objects.all(), 100)  # Process in batches of 100
        updated_count = 0
        
        for page_num in paginator.page_range:
            page = paginator.page(page_num)
            for passport in page.object_list:
                service = UpdateTrustScoreService(user=passport.user)
                service.execute()
                updated_count += 1
        
            return Response({
                'message': f'Updated trust scores for {updated_count} users (batch processed)'
            })

class AwardPointsView(generics.GenericAPIView):
    """Legacy endpoint for awarding points"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Sample POST:
        {
            "action_type": "TIP_CREATED",
            "points": 10,
            "metadata": {"tip_id": 123}
        }
        """
        data = request.data
        
        # SECURITY: Only admins can award points
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can award points'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Input validation
        action_type = data.get('action_type')
        points = data.get('points', 0)
        metadata = data.get('metadata', {})
        
        # Validate points amount
        try:
            points = int(points)
            if points <= 0 or points > 1000:  # Max 1000 points per award
                return Response(
                    {'error': 'Points must be between 1 and 1000'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid points format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate action_type
        valid_actions = ['TIP_CREATED', 'CHAT_HELPFUL', 'SOS_RESPONSE', 'VERIFIED_LOCAL', 'POST_MOMENT']
        if action_type not in valid_actions:
            return Response(
                {'error': 'Invalid action type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use service layer for awarding points
        service = AwardPointsService(
            user=request.user,
            points=points,
            transaction_type=action_type,
            description=f"Activity: {action_type}",
            metadata=metadata
        )
        passport = service.execute()

        return Response({
            "trust_score": passport.trust_score,
            "points": passport.points,
            "level": passport.level
        })
