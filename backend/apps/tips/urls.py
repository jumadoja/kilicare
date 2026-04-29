from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateTipView, ListTipsView, UpvoteTipView, TipViewSet

router = DefaultRouter()
router.register('tips', TipViewSet, basename='tips')

urlpatterns = [
    path('', include(router.urls)),
    # Legacy endpoints for backward compatibility
    path("create/", CreateTipView.as_view(), name="create-tip"),
    path("list/", ListTipsView.as_view(), name="list-tips"),
    path("upvote/<int:tip_id>/", UpvoteTipView.as_view(), name="upvote-tip"),
]
