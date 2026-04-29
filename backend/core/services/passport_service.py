from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.utils import timezone
import datetime
from .base_service import BaseService
from ..exceptions import (
    ValidationError,
    NotFoundError,
    PermissionDeniedError,
)

User = get_user_model()


class AwardPointsService(BaseService):
    """Service for awarding points to users"""
    
    def execute(self, user_id, points, transaction_type, description='', metadata=None):
        """
        Award points to a user
        """
        if points <= 0:
            raise ValidationError("Points must be positive")
        
        if points > 1000:
            raise ValidationError("Cannot award more than 1000 points at once")
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFoundError("User not found", resource_type="User")
        
        from apps.passport.models import PassportProfile, PointsTransaction
        
        passport, created = PassportProfile.objects.get_or_create(user=user)
        
        with transaction.atomic():
            # Update points
            passport.points += points
            
            # Create transaction record
            PointsTransaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                points_change=points,
                balance_after=passport.points,
                description=description,
                metadata=metadata or {}
            )
            
            # Update trust score and level
            passport.trust_score = passport.points + (user.badges.count() * 10)
            passport.update_level()
            passport.save()
        
        return passport


class DeductPointsService(BaseService):
    """Service for deducting points from users"""
    
    def execute(self, user_id, points, transaction_type, description='', metadata=None):
        """
        Deduct points from a user
        """
        if points <= 0:
            raise ValidationError("Points must be positive")
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFoundError("User not found", resource_type="User")
        
        from apps.passport.models import PassportProfile, PointsTransaction
        
        passport, created = PassportProfile.objects.get_or_create(user=user)
        
        # Don't go below zero
        points_to_deduct = min(points, passport.points)
        
        with transaction.atomic():
            # Update points
            passport.points -= points_to_deduct
            
            # Create transaction record
            PointsTransaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                points_change=-points_to_deduct,
                balance_after=passport.points,
                description=description,
                metadata=metadata or {}
            )
            
            # Update trust score and level
            passport.trust_score = max(0, passport.points + (user.badges.count() * 10))
            passport.update_level()
            passport.save()
        
        return passport


class CreatePassportActivityService(BaseService):
    """Service for creating passport activities"""
    
    def execute(self, user, action_type, points_awarded=0, metadata=None):
        """
        Create a passport activity and award points
        """
        from apps.passport.models import PassportActivity, PassportProfile
        
        # Create activity
        activity = PassportActivity.objects.create(
            user=user,
            action_type=action_type,
            points_awarded=points_awarded,
            metadata=metadata or {}
        )
        
        # Award points if specified
        if points_awarded > 0:
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=points_awarded,
                transaction_type=action_type,
                description=f"Activity: {action_type}",
                metadata=metadata or {}
            )
        
        return activity


class UpdateTrustScoreService(BaseService):
    """Service for updating user trust scores"""
    
    def execute(self, user_id=None):
        """
        Update trust score for a user or all users
        """
        from apps.passport.models import PassportProfile
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                passport, _ = PassportProfile.objects.get_or_create(user=user)
                passport.update_trust_score()
                return passport
            except User.DoesNotExist:
                raise NotFoundError("User not found", resource_type="User")
        else:
            # Update all users' trust scores
            from django.core.paginator import Paginator
            
            paginator = Paginator(PassportProfile.objects.all(), 100)
            updated_count = 0
            
            for page_num in paginator.page_range:
                page = paginator.page(page_num)
                for passport in page.object_list:
                    passport.update_trust_score()
                    updated_count += 1
            
            return {"updated_count": updated_count}


class CheckBadgeUnlockService(BaseService):
    """Service for checking and unlocking badges"""
    
    def execute(self, user):
        """
        Check if user qualifies for new badges and unlock them
        """
        from apps.passport.models import PassportProfile, PassportBadge, UserBadge
        
        passport, _ = PassportProfile.objects.get_or_create(user=user)
        
        # Get badges user qualifies for
        eligible_badges = PassportBadge.objects.filter(
            criteria_points__lte=passport.points
        ).exclude(
            id__in=user.badges.values_list('badge_id', flat=True)
        )
        
        # Unlock badges
        unlocked_badges = []
        with transaction.atomic():
            for badge in eligible_badges:
                UserBadge.objects.create(user=user, badge=badge)
                unlocked_badges.append(badge)
        
        return unlocked_badges


class GetLeaderboardService(BaseService):
    """Service for getting passport leaderboard"""
    
    def execute(self, metric='trust_score', limit=50):
        """
        Get leaderboard by metric (trust_score, points, level)
        """
        if metric not in ['trust_score', 'points', 'level']:
            metric = 'trust_score'
        
        from apps.passport.models import PassportProfile
        
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
                'passport_data': {
                    'points': passport.points,
                    'trust_score': passport.trust_score,
                    'level': passport.level,
                    'level_name': passport.get_level_info()['name']
                },
                'statistics': stats
            })
        
        return leaderboard_data
