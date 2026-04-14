# kilicaremoments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('moments', MomentViewSet)  # tourist/local moments
router.register('follow', FollowViewSet, basename='follow')  # follow/unfollow users
router.register('music', MusicViewSet)  # background music
router.register('admin/moments', AdminMomentViewSet, basename='admin-moments')  # Admin verification, UNIQUE basename!

urlpatterns = [
    path('', include(router.urls)),]