import requests
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import UserAIPreference, ProactiveAlert

User = get_user_model()


@shared_task
def check_weather_and_notify_users():
    """
    Inacheki hali ya hewa kila siku na kutuma alerts kwa watumiaji.
    Logic: Inatafuta watumiaji, inacheki utabiri wa mvua, na kusave alert.
    """
    users = User.objects.all()
    weather_api_key = getattr(settings, "WEATHER_API_KEY", None)

    # 🔥 safety: usipige API kama key haipo
    if not weather_api_key:
        print("WEATHER_API_KEY haijawekwa.")
        return

    for user in users:
        # 🔥 future-ready: unaweza replace na user.profile.location
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

            # 🔥 defensive parsing (avoid KeyError)
            forecast = data.get('forecast', {}).get('forecastday', [])
            if not forecast:
                continue

            day_data = forecast[0].get('day', {})
            will_it_rain = day_data.get('daily_will_it_rain')

            if will_it_rain == 1:
                msg = (
                    f"Habari {user.username}! Kuna uwezekano mkubwa wa mvua kesho huko {location}. "
                    f"Hakikisha umebeba koti la mvua!"
                )

                # 🔥 Anti-spam: ndani ya saa 12
                already_notified = ProactiveAlert.objects.filter(
                    user=user,
                    alert_type="weather",
                    created_at__gte=timezone.now() - timezone.timedelta(hours=12)
                ).exists()

                if not already_notified:
                    ProactiveAlert.objects.create(
                        user=user,
                        message=msg,
                        alert_type="weather"
                    )
                    # 🔥 hapa unaweza hook FCM / push notification

        except Exception as e:
            print(f"Weather Task Error kwa {user.username}: {e}")


@shared_task
def notify_local_events():
    """
    Inatafuta matukio kulingana na mapendeleo ya mtumiaji (mfano: Mshikaki, Nature).
    """

    # 🔥 JSONField safe filtering (better kuliko icontains raw)
    prefs = UserAIPreference.objects.all()

    for pref in prefs:
        user = pref.user

        if not pref.interests:
            continue

        # 🔥 normalize interests (aligned na serializer)
        interests = [i.lower() for i in pref.interests if isinstance(i, str)]

        if "mshikaki" not in interests:
            continue

        msg = (
            f"Habari {user.username}! Naona kuna tamasha la Mshikaki Dodoma wiki hii. "
            f"Ungependa nikutafutie tiketi au maelekezo?"
        )

        # 🔥 Anti-duplicate (same message)
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
    Inafuta alerts za zamani (zaidi ya siku 7) ili database isijae sana.
    """
    threshold = timezone.now() - timezone.timedelta(days=7)

    deleted, _ = ProactiveAlert.objects.filter(
        created_at__lt=threshold
    ).delete()

    print(f"Alerts zilizofutwa: {deleted}")