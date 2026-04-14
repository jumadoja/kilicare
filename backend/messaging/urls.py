from django.urls import path, re_path
from . import views
from . import consumers

# REST API endpoints (Zimesawazishwa na Kilicare Project Structure)
urlpatterns = [
    # 1. Kutuma meseji mpya (REST Backup)
    path('send/', views.SendMessageView.as_view(), name='send-message'),
    
    # 2. Historia ya meseji kati ya watu wawili
    path('history/<int:user_id>/', views.MessageHistoryView.as_view(), name='message-history'),
    
    # 3. Historia kulingana na Room ID (Kwa ajili ya Groups)
    path('history/room/<int:room_id>/', views.MessageHistoryView.as_view(), name='room-history'),
    
    # 4. Orodha ya watu uliochati nao (Contacts list / Sidebar)
    path('contacts/', views.ChatContactsView.as_view(), name='chat-contacts'),
    
    # 5. Vyumba vya chati (Room management)
    path('rooms/', views.ChatRoomListCreateView.as_view(), name='chat-rooms'),

    # --- MPYA: LOGIC YA KUFUTA CHATI ---
    # Inapokea ID ya yule mtu unayetaka kuficha chati yake
    path('delete-chat/<int:user_id>/', views.DeleteChatView.as_view(), name='delete-chat'),
    
    path('delete/<int:message_id>/', views.DeleteSingleMessageView.as_view(), name='delete-single-message'),
]

# WebSocket endpoints (Real-time signals)
# ws://127.0.0.1:8000/ws/chat/room_name/
websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]