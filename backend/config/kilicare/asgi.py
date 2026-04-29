import os
import django
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 1. SETTINGS SETUP: Lazima iwe juu kabisa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.getenv('DJANGO_SETTINGS_MODULE', 'config.settings.dev'))
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.messaging.middleware import JWTAuthMiddleware  # Middleware yetu ya usalama
import apps.messaging.routing
import apps.sos.routing

# 2. PROTOCOL ROUTER: Hapa ndipo tunatofautisha HTTP na WebSocket
application = ProtocolTypeRouter({
    # Kwa ajili ya standard web requests (GET, POST, views.py)
    "http": get_asgi_application(),
    
    # Kwa ajili ya Real-time features (WebSockets)
    "websocket": JWTAuthMiddleware(
        URLRouter(
            apps.messaging.routing.websocket_urlpatterns +
            apps.sos.routing.websocket_urlpatterns
        )
    ),
})