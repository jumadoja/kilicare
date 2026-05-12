# kilicaremoments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
# Register specific routes first, then the empty string route
router.register('follow', FollowViewSet, basename='follow')  # follow/unfollow users
router.register('music', MusicViewSet, basename='music')  # background music
router.register('admin/moments', AdminMomentViewSet, basename='admin-moments')  # Admin verification, UNIQUE basename!
router.register('', MomentViewSet, basename='moments')  # tourist/local moments - clean REST style (must be last)

urlpatterns = [
    path('', include(router.urls)),]