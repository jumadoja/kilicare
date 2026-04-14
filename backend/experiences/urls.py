from django.urls import path
from .views import LocalExperienceListCreateView, LocalExperienceDetailView, TodayNearMeView

urlpatterns = [
    path('', LocalExperienceListCreateView.as_view(), name='experience-list-create'),
    path('<int:pk>/', LocalExperienceDetailView.as_view(), name='experience-detail'),
    path('today-near-me/', TodayNearMeView.as_view(), name='today-near-me'),
]
