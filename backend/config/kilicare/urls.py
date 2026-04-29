from django.contrib import admin
from django.urls import path, include
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Django Admin (DON'T TOUCH)
    path('admin/', admin.site.urls),

    # GraphQL + GraphiQL
    path(
        'graphql/',
        csrf_exempt(GraphQLView.as_view(graphiql=True))
    ),

    # JWT Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_standard'),

    # Users
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