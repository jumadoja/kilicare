"""
Main API URL configuration for KILICARE+
"""
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Authentication APIs
    path('auth/', include('users.urls')),
    
    # Core Feature APIs
    path('moments/', include('kilicaremoments.urls')),
    path('experiences/', include('experiences.urls')),
    path('messaging/', include('messaging.urls')),
    path('tips/', include('tips.urls')),
    
    # Advanced Features
    path('passport/', include('passport.urls')),
    path('sos/', include('sos.urls')),
    path('ai/', include('ai.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
