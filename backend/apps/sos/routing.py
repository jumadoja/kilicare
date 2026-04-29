from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # SOS WebSocket endpoint for real-time emergency alerts
    re_path(r'ws/sos/$', consumers.SOSConsumer.as_asgi()),
]
