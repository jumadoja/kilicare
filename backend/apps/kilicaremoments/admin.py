from django.contrib import admin
from .models import (
    KilicareMoment, MomentLike, MomentComment, SavedMoment, 
    Follow, BackgroundMusic, AdminActionLog
)

@admin.register(KilicareMoment)
class KilicareMomentAdmin(admin.ModelAdmin):
    list_display = ('id', 'posted_by', 'caption', 'media_type', 'visibility', 'is_featured', 'views', 'created_at')
    list_filter = ('media_type', 'visibility', 'is_featured', 'created_at')
    search_fields = ('caption', 'location', 'posted_by__username')
    readonly_fields = ('created_at', 'updated_at', 'views')
    ordering = ('-created_at',)

@admin.register(MomentLike)
class MomentLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'moment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'moment__caption')
    ordering = ('-created_at',)

@admin.register(MomentComment)
class MomentCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'moment', 'comment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'comment', 'moment__caption')
    ordering = ('-created_at',)

@admin.register(SavedMoment)
class SavedMomentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'moment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'moment__caption')
    ordering = ('-created_at',)

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower__username', 'following__username')
    ordering = ('-created_at',)

@admin.register(BackgroundMusic)
class BackgroundMusicAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'description')
    search_fields = ('title', 'description')

@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'admin', 'action', 'target_user', 'target_moment', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('admin__username', 'action')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
