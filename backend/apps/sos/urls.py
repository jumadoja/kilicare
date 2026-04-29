from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SOSAlertViewSet, SOSResponseViewSet

router = DefaultRouter()
router.register(r'alerts', SOSAlertViewSet, basename='sos-alert')
router.register(r'responses', SOSResponseViewSet, basename='sos-response')

urlpatterns = [
    path('', include(router.urls)),
]
