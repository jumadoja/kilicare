from django.contrib import admin
from .models import Tip


@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "category",
        "created_by",
        "upvotes",
        "is_public",
        "created_at",
    )

    list_filter = ("category", "is_public", "created_at")

    search_fields = ("title", "description", "created_by__username")

    ordering = ("-created_at",)
