from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def send_welcome_email(user_id):
    """Send welcome email to new user"""
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject="Welcome to Kilicare+!",
            message=f"Hello {user.username}, welcome to Kilicare+! Your journey begins now.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {user.email}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return False


@shared_task
def send_password_reset_email(user_id, otp):
    """Send password reset OTP email"""
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject="Your Password Reset OTP",
            message=f"Hello {user.username}, your OTP code is {otp}. It expires in 10 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Password reset OTP sent to {user.email}")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False


@shared_task
def update_user_activity_stats():
    """Update user activity statistics (scheduled task)"""
    from apps.users.models import UserActivity
    from django.utils import timezone
    from datetime import timedelta
    
    # Clean up old activities (older than 90 days)
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count = UserActivity.objects.filter(timestamp__lt=cutoff_date).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old user activities")
    return {"deleted_count": deleted_count}


@shared_task
def send_daily_digest_email(user_id):
    """Send daily digest email to user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Get user's recent activities
        from apps.users.models import UserActivity
        from datetime import timedelta
        
        recent_activities = UserActivity.objects.filter(
            user=user,
            timestamp__gte=timezone.now() - timedelta(days=1)
        ).order_by('-timestamp')[:5]
        
        if not recent_activities:
            return False
        
        activity_summary = "\n".join([
            f"- {activity.action_type}: {activity.action}" 
            for activity in recent_activities
        ])
        
        send_mail(
            subject="Your Daily Kilicare+ Digest",
            message=f"Hello {user.username},\n\nHere's your activity summary:\n{activity_summary}\n\nKeep exploring!",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send daily digest: {str(e)}")
        return False


@shared_task
def cleanup_expired_otps():
    """Clean up expired OTPs (scheduled task)"""
    from apps.users.models import PasswordResetOTP
    from django.utils import timezone
    
    deleted_count = PasswordResetOTP.objects.filter(
        expires_at__lt=timezone.now(),
        is_used=False
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} expired OTPs")
    return {"deleted_count": deleted_count}