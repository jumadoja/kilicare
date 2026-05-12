from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.middleware.graphql_view import graphql_view

urlpatterns = [
    # Django Admin (DON'T TOUCH)
    path('admin/', admin.site.urls),

    # GraphQL with CSRF protection and security middleware
    path('graphql/', graphql_view()),

    # OpenAPI/Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Users (includes JWT endpoints)
    path('auth/', include('apps.users.urls')),

    # --- API APPS (FIXED TO BE CONSISTENT) ---
    path('api/moments/', include('apps.kilicaremoments.urls')),
    path('api/experiences/', include('apps.experiences.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/tips/', include('apps.tips.urls')),

    # Phase 9 - Kilicare Passport™
    path("api/passport/", include("apps.passport.urls")),
    
    # SOS System
    path('api/sos/', include('apps.sos.urls')),
    
    path('api/admin/', include('apps.adminpanel.urls')),
]

# MEDIA (images & videos) - Imebaki vilevile bila kugusa logic
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )