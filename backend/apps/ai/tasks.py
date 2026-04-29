import requests
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def check_weather_and_notify_users():
    """
    Check weather daily and send alerts to users.
    Logic: Finds users, checks rain forecast, and saves alert.
    """
    users = User.objects.all()
    weather_api_key = getattr(settings, "WEATHER_API_KEY", None)

    # Safety: Don't hit API if key doesn't exist
    if not weather_api_key:
        print("WEATHER_API_KEY not configured.")
        return

    for user in users:
        # Future-ready: can replace with user.profile.location
        location = "Arusha"

        url = (
            f"http://api.weatherapi.com/v1/forecast.json"
            f"?key={weather_api_key}&q={location}&days=1"
        )

        try:
            res = requests.get(url, timeout=10)

            if res.status_code != 200:
                continue

            data = res.json()

            # Defensive parsing (avoid KeyError)
            forecast = data.get('forecast', {}).get('forecastday', [])
            if not forecast:
                continue

            day_data = forecast[0].get('day', {})
            will_it_rain = day_data.get('daily_will_it_rain')

            if will_it_rain == 1:
                msg = (
                    f"Hello {user.username}! There's a high chance of rain tomorrow in {location}. "
                    f"Make sure to bring a raincoat!"
                )

                # Anti-spam: within 12 hours
                from apps.ai.models import ProactiveAlert
                already_notified = ProactiveAlert.objects.filter(
                    user=user,
                    alert_type="weather",
                    created_at__gte=timezone.now() - timedelta(hours=12)
                ).exists()

                if not already_notified:
                    ProactiveAlert.objects.create(
                        user=user,
                        message=msg,
                        alert_type="weather"
                    )
                    # Can hook FCM / push notification here

        except Exception as e:
            print(f"Weather Task Error for {user.username}: {e}")


@shared_task
def notify_local_events():
    """
    Find events based on user preferences (e.g., Mshikaki, Nature).
    """
    from apps.ai.models import UserAIPreference, ProactiveAlert

    # JSONField safe filtering (better than raw icontains)
    prefs = UserAIPreference.objects.all()

    for pref in prefs:
        user = pref.user

        if not pref.interests:
            continue

        # Normalize interests (aligned with serializer)
        interests = [i.lower() for i in pref.interests if isinstance(i, str)]

        if "mshikaki" not in interests:
            continue

        msg = (
            f"Hello {user.username}! There's a Mshikaki festival in Dodoma this week. "
            f"Would you like me to find tickets or directions?"
        )

        # Anti-duplicate (same message)
        already_sent = ProactiveAlert.objects.filter(
            user=user,
            message=msg,
            alert_type="event"
        ).exists()

        if not already_sent:
            ProactiveAlert.objects.create(
                user=user,
                message=msg,
                alert_type="event"
            )


@shared_task
def cleanup_old_alerts():
    """
    Delete old alerts (older than 7 days) to keep database clean.
    """
    from apps.ai.models import ProactiveAlert
    
    threshold = timezone.now() - timedelta(days=7)

    deleted, _ = ProactiveAlert.objects.filter(
        created_at__lt=threshold
    ).delete()

    print(f"Alerts deleted: {deleted}")
    return {"deleted": deleted}