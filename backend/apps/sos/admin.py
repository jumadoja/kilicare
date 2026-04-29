from django.contrib import admin
from .models import SOSAlert, SOSResponse

@admin.register(SOSAlert)
class SOSAlertAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'severity', 'status', 'created_at', 'responder_count']
    list_filter = ['severity', 'status', 'created_at']
    search_fields = ['user__username', 'location_address', 'message']
    readonly_fields = ['created_at', 'resolved_at']
    
    def responder_count(self, obj):
        return obj.responders.count()
    responder_count.short_description = 'Responders'

@admin.register(SOSResponse)
class SOSResponseAdmin(admin.ModelAdmin):
    list_display = ['id', 'alert', 'responder', 'is_onsite', 'created_at']
    list_filter = ['is_onsite', 'created_at']
    search_fields = ['responder__username', 'message']
    readonly_fields = ['created_at']
