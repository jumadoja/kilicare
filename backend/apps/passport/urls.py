from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyPassportView, UserBadgesView, AwardPointsView, PassportViewSet

router = DefaultRouter()
router.register('', PassportViewSet, basename='passport')

urlpatterns = [
    path('', include(router.urls)),
    # Legacy endpoints for backward compatibility
    path('me/', MyPassportView.as_view(), name='my-passport'),
    path('badges/', UserBadgesView.as_view(), name='my-badges'),
    path('award-points/', AwardPointsView.as_view(), name='award-points'),
]
