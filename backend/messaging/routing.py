from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Hii inakubali URL kama: ws://127.0.0.1:8000/ws/chat/1_2/
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]