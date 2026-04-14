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

    # Users
    path('auth/', include('users.urls')),

    # --- API APPS (FIXED TO BE CONSISTENT) ---
    path('api/moments/', include('kilicaremoments.urls')),
    path('api/experiences/', include('experiences.urls')), # Sasa itakuwa /api/experiences/
    path('api/messages/', include('messaging.urls')),    # Sasa itakuwa /api/messages/
    path('api/ai/', include('ai.urls')),
    path('api/tips/', include('tips.urls')),

    # Phase 9 - Kilicare Passport™
    path("api/passport/", include("passport.urls")),
    
    path('api/admin/', include('adminpanel.urls')),
]

# MEDIA (images & videos) - Imebaki vilevile bila kugusa logic
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )