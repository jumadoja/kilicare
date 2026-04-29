from celery import shared_task
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def send_message_notification(user_id, message_id):
    """Send notification for new message"""
    try:
        from apps.messaging.models import Message
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        message = Message.objects.get(id=message_id)
        user = User.objects.get(id=user_id)
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_notifications_{user_id}',
            {
                'type': 'notification',
                'message': 'new_message',
                'data': {
                    'message_id': message.id,
                    'sender': message.sender.username,
                    'content': message.content[:100] if message.content else '[Media]',
                    'timestamp': message.timestamp.isoformat()
                }
            }
        )
        
        return True
    except Exception as e:
        logger.error(f"Failed to send message notification: {str(e)}")
        return False


@shared_task
def cleanup_deleted_messages():
    """Permanently delete soft-deleted messages older than 30 days"""
    from apps.messaging.models import Message
    from django.utils import timezone
    from datetime import timedelta
    
    # Find messages marked as deleted that are older than 30 days
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # This is a soft delete cleanup - we could hard delete or keep them
    # For now, we'll just log the count
    deleted_count = Message.objects.filter(
        is_deleted=True,
        deleted_at__lt=cutoff_date
    ).count()
    
    logger.info(f"Found {deleted_count} messages eligible for permanent deletion")
    return {"eligible_for_deletion": deleted_count}


@shared_task
def update_chat_statistics():
    """Update chat statistics (scheduled task)"""
    from apps.messaging.models import ChatRoom, Message
    from django.db.models import Count
    
    # Get active chat rooms (with messages in last 7 days)
    from django.utils import timezone
    from datetime import timedelta
    
    recent_cutoff = timezone.now() - timedelta(days=7)
    active_rooms = ChatRoom.objects.filter(
        messages__timestamp__gte=recent_cutoff
    ).distinct().count()
    
    total_messages = Message.objects.count()
    total_rooms = ChatRoom.objects.count()
    
    stats = {
        'active_rooms': active_rooms,
        'total_messages': total_messages,
        'total_rooms': total_rooms,
        'timestamp': timezone.now().isoformat()
    }
    
    # Cache statistics for 1 hour
    from core.utils import cache_set
    cache_set('chat_statistics', stats, timeout=3600)
    
    logger.info(f"Chat statistics updated: {stats}")
    return stats
