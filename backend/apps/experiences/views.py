from rest_framework import generics, pagination
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from django.core.cache import cache
from django.utils import timezone
from .models import LocalExperience
from .serializers import LocalExperienceSerializer
from core.services.experiences_service import CreateExperienceService

# 1. LIST/CREATE: Kwa ajili ya Locals na Admin
class LocalExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = LocalExperienceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = pagination.LimitOffsetPagination

    def get_queryset(self):
        # TWIST 3: Prefetch inafanya picha zivutwe kwa mpigo mmoja (Kasi zaidi)
        return LocalExperience.objects.select_related('local').prefetch_related('media_files').all().order_by('-created_at')

    def perform_create(self, serializer):
        # Use service layer for experience creation
        service = CreateExperienceService(
            user=self.request.user,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description'),
            location=serializer.validated_data.get('location'),
            media_files=serializer.validated_data.get('media_files'),
            today_moment_active=serializer.validated_data.get('today_moment_active', False),
            today_moment_date=serializer.validated_data.get('today_moment_date')
        )
        experience = service.execute()
        serializer.instance = experience

# 2. DETAIL: Kwa ajili ya kuona/kurekebisha experience moja
class LocalExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LocalExperienceSerializer
    queryset = LocalExperience.objects.prefetch_related('media_files').all()
    permission_classes = [IsAuthenticatedOrReadOnly]

# 3. TOURIST VIEW: Kwa ajili ya page ya "Discover" (Leo)
class TodayNearMeView(generics.ListAPIView):
    serializer_class = LocalExperienceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # TWIST 2: Inachuja vitu vya LEO tu hata kama Local alisahau kuzima
        today = timezone.localdate()
        return LocalExperience.objects.filter(
            today_moment_active=True,
            today_moment_date=today
        ).prefetch_related('media_files').order_by('-created_at')