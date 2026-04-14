import os
import django

# 1. SETTINGS SETUP: Lazima iwe juu kabisa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kilicare.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from messaging.middleware import JWTAuthMiddleware  # Middleware yetu ya usalama
import messaging.routing

# 2. PROTOCOL ROUTER: Hapa ndipo tunatofautisha HTTP na WebSocket
application = ProtocolTypeRouter({
    # Kwa ajili ya standard web requests (GET, POST, views.py)
    "http": get_asgi_application(),
    
    # Kwa ajili ya Real-time chat (WebSockets)
    "websocket": JWTAuthMiddleware(
        URLRouter(
            messaging.routing.websocket_urlpatterns
        )
    ),
})