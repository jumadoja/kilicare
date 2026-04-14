from django.contrib import admin
from .models import PassportProfile, PassportBadge, UserBadge, PassportActivity

@admin.register(PassportProfile)
class PassportProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'trust_score', 'points', 'level', 'is_verified', 'created_at')
    search_fields = ('user__username',)
    list_filter = ('level', 'is_verified')

@admin.register(PassportBadge)
class PassportBadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'criteria_points')

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'unlocked_at')
    search_fields = ('user__username', 'badge__name')

@admin.register(PassportActivity)
class PassportActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action_type', 'points_awarded', 'created_at')
    list_filter = ('action_type',)
    search_fields = ('user__username',)
