from celery import shared_task
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def update_all_trust_scores():
    """Update trust scores for all users (scheduled task)"""
    from apps.passport.models import PassportProfile
    
    from django.core.paginator import Paginator
    
    paginator = Paginator(PassportProfile.objects.all(), 100)
    updated_count = 0
    
    for page_num in paginator.page_range:
        page = paginator.page(page_num)
        for passport in page.object_list:
            passport.update_trust_score()
            updated_count += 1
    
    logger.info(f"Updated trust scores for {updated_count} users")
    return {"updated_count": updated_count}


@shared_task
def check_and_award_badges(user_id):
    """Check if user qualifies for new badges and award them"""
    from apps.passport.models import PassportProfile, PassportBadge, UserBadge
    from django.db import transaction
    
    try:
        user = User.objects.get(id=user_id)
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
                unlocked_badges.append(badge.name)
        
        logger.info(f"Awarded badges to {user.username}: {unlocked_badges}")
        return {"unlocked_badges": unlocked_badges}
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {"unlocked_badges": []}


@shared_task
def recalculate_leaderboard():
    """Recalculate leaderboard rankings (scheduled task)"""
    from apps.passport.models import PassportProfile
    from django.db.models import Count
    
    # Get top users by trust score
    top_users = PassportProfile.objects.select_related('user').order_by('-trust_score')[:100]
    
    leaderboard_data = []
    for rank, passport in enumerate(top_users, 1):
        leaderboard_data.append({
            'rank': rank,
            'user_id': passport.user.id,
            'username': passport.user.username,
            'trust_score': passport.trust_score,
            'points': passport.points,
            'level': passport.level
        })
    
    # Cache leaderboard for 1 hour
    from core.utils import cache_set
    cache_set('leaderboard_top_100', leaderboard_data, timeout=3600)
    
    logger.info("Leaderboard recalculated and cached")
    return {"total_users": len(leaderboard_data)}


@shared_task
def cleanup_old_transactions():
    """Clean up old points transactions (scheduled task)"""
    from apps.passport.models import PointsTransaction
    from django.utils import timezone
    from datetime import timedelta
    
    # Delete transactions older than 1 year
    cutoff_date = timezone.now() - timedelta(days=365)
    deleted_count = PointsTransaction.objects.filter(
        created_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old transactions")
    return {"deleted_count": deleted_count}
