from django.urls import path
from .views import MyPassportView, UserBadgesView, AwardPointsView

urlpatterns = [
    path('me/', MyPassportView.as_view(), name='my-passport'),
    path('badges/', UserBadgesView.as_view(), name='my-badges'),
    path('award-points/', AwardPointsView.as_view(), name='award-points'),
]
