"""
Main URL configuration for Kilicare Backend
"""
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', include('config.kilicare.urls')),
]

# Serve media files in development (static files handled by WhiteNoise)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
