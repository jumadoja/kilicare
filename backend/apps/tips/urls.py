from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipViewSet

router = DefaultRouter()
router.register('', TipViewSet, basename='tips')

urlpatterns = [
    path('', include(router.urls)),
]
