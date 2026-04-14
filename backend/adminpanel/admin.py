from django.contrib import admin
from tips.models import Tip
from kilicaremoments.models import KilicareMoment
from ai.models import AIActivity
from users.models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_verified', 'date_joined')
    list_filter = ('role', 'is_verified', 'date_joined')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)

@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_by', 'upvotes', 'is_public', 'created_at')
    list_filter = ('category', 'is_public', 'created_at')
    search_fields = ('title', 'description', 'created_by__username')
    ordering = ('-created_at',)

@admin.register(KilicareMoment)
class MomentAdmin(admin.ModelAdmin):
    list_display = ('caption', 'posted_by', 'is_public', 'created_at')
    list_filter = ('is_public', 'created_at')
    search_fields = ('caption', 'posted_by__username')
    ordering = ('-created_at',)

@admin.register(AIActivity)
class AIActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action_type', 'input_text', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('user__username', 'input_text', 'output_text')
    ordering = ('-created_at',)
