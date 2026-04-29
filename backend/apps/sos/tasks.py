from celery import shared_task
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def cleanup_resolved_alerts():
    """Clean up resolved SOS alerts older than 30 days"""
    from apps.sos.models import SOSAlert
    from django.utils import timezone
    from datetime import timedelta
    
    # Archive resolved alerts older than 30 days
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # Count resolved alerts
    resolved_alerts = SOSAlert.objects.filter(
        status='RESOLVED',
        resolved_at__lt=cutoff_date
    ).count()
    
    # Archive them (soft delete by marking as archived)
    # For now, we'll just log the count
    logger.info(f"Found {resolved_alerts} resolved alerts eligible for archival")
    return {"eligible_for_archival": resolved_alerts}


@shared_task
def send_sos_notification_to_nearby_users(alert_id):
    """Send SOS notification to nearby users"""
    try:
        from apps.sos.models import SOSAlert
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        alert = SOSAlert.objects.get(id=alert_id)
        
        # Get nearby users (within 50km)
        # This would use geospatial queries in production
        nearby_users = User.objects.filter(
            role__in=['LOCAL_GUIDE', 'ADMIN']
        )[:10]  # Limit to 10 for now
        
        channel_layer = get_channel_layer()
        
        for user in nearby_users:
            async_to_sync(channel_layer.group_send)(
                f'user_notifications_{user.id}',
                {
                    'type': 'notification',
                    'message': 'sos_alert',
                    'data': {
                        'alert_id': alert.id,
                        'severity': alert.severity,
                        'location': alert.location_address,
                        'latitude': float(alert.latitude),
                        'longitude': float(alert.longitude),
                        'timestamp': alert.created_at.isoformat()
                    }
                }
            )
        
        logger.info(f"SOS notification sent to {nearby_users.count()} nearby users")
        return {"notified_count": nearby_users.count()}
    except SOSAlert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found")
        return {"notified_count": 0}
    except Exception as e:
        logger.error(f"Failed to send SOS notification: {str(e)}")
        return {"notified_count": 0}


@shared_task
def update_sos_statistics():
    """Update SOS statistics (scheduled task)"""
    from apps.sos.models import SOSAlert
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta
    
    # Get statistics
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
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
        'timestamp': now.isoformat()
    }
    
    # Cache statistics for 1 hour
    from core.utils import cache_set
    cache_set('sos_statistics', stats, timeout=3600)
    
    logger.info(f"SOS statistics updated: {stats}")
    return stats
