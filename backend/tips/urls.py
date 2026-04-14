from django.urls import path
from .views import CreateTipView, ListTipsView, UpvoteTipView

urlpatterns = [
    path("create/", CreateTipView.as_view(), name="create-tip"),
    path("list/", ListTipsView.as_view(), name="list-tips"),
    path("upvote/<int:tip_id>/", UpvoteTipView.as_view(), name="upvote-tip"),
]
