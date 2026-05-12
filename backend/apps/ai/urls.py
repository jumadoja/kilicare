from django.urls import path
from .views import (
    KilicareAIView,
    VoiceToTextView,
    UserPreferenceView,
    AIThreadListView,
    ProactiveAlertListView
)

urlpatterns = [
    # 1. Main AI Chat Engine (Text + Image + JSON Response + Memory)
    path("chat/", KilicareAIView.as_view(), name="ai-chat"),

    # 2. Voice → Text (Whisper)
    path("voice-to-text/", VoiceToTextView.as_view(), name="ai-voice"),

    # 3. User Preferences (Language, Voice, Interests)
    path("preferences/", UserPreferenceView.as_view(), name="ai-preferences"),

    # 4. Chat Threads (Sidebar history)
    path("threads/", AIThreadListView.as_view(), name="ai-threads"),

    # 5. Proactive Alerts
    path("proactive-alerts/", ProactiveAlertListView.as_view(), name="ai-alerts"),
]