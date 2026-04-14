from django.urls import path
from .views import (
    LocalUsersListView, VerifyLocalUserView,
    TipListAdminView, TipModerateView,
    MomentListAdminView, MomentModerateView,
    AIActivityListView
)

urlpatterns = [
    # Users
    path('locals/', LocalUsersListView.as_view(), name='admin-locals'),
    path('locals/verify/<int:pk>/', VerifyLocalUserView.as_view(), name='verify-local'),

    # Tips
    path('tips/', TipListAdminView.as_view(), name='admin-tips'),
    path('tips/<int:pk>/moderate/', TipModerateView.as_view(), name='moderate-tip'),

    # Moments
    path('moments/', MomentListAdminView.as_view(), name='admin-moments'),
    path('moments/<int:pk>/moderate/', MomentModerateView.as_view(), name='moderate-moment'),

    # AI Logs
    path('ai-logs/', AIActivityListView.as_view(), name='admin-ai-logs'),
]