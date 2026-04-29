from django.contrib import admin
from .models import AIThread, AIActivity, UserAIPreference, ProactiveAlert

@admin.register(AIActivity)
class AIActivityAdmin(admin.ModelAdmin):
    # Tumesahihisha: 'role' badala ya 'action_type'
    # 'thread' badala ya 'user' (maana AIActivity inaunganishwa na Thread)
    list_display = ('id', 'thread', 'role', 'timestamp')
    list_filter = ('role', 'timestamp')
    # Tumesahihisha: 'content' badala ya 'input_text'
    search_fields = ('content', 'thread__user__username')

@admin.register(AIThread)
class AIThreadAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at', 'updated_at')
    search_fields = ('title', 'user__username')

@admin.register(UserAIPreference)
class UserAIPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_language', 'preferred_voice')

@admin.register(ProactiveAlert)
class ProactiveAlertAdmin(admin.ModelAdmin):
    list_display = ('user', 'alert_type', 'created_at', 'is_sent')