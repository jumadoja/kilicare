
from django.contrib import admin
from .models import LocalExperience, ExperienceMedia

@admin.register(LocalExperience)
class LocalExperienceAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'local',
        'location',
        'today_moment_active',
        'today_moment_date',
        'created_at'
    )
    list_filter = ('today_moment_active', 'location')
    search_fields = ('title', 'description', 'location')
    ordering = ('-created_at',)


@admin.register(ExperienceMedia)
class ExperienceMediaAdmin(admin.ModelAdmin):
    list_display = ('experience', 'media_type', 'uploaded_at')