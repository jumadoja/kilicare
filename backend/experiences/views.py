from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from django.utils import timezone
from .models import LocalExperience
from .serializers import LocalExperienceSerializer

# 1. LIST/CREATE: Kwa ajili ya Locals na Admin
class LocalExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = LocalExperienceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # TWIST 3: Prefetch inafanya picha zivutwe kwa mpigo mmoja (Kasi zaidi)
        return LocalExperience.objects.select_related('local').prefetch_related('media_files').all().order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        # Ulinzi: Local aliyethibitishwa tu ndio anaposti
        if user.role != 'LOCAL' or not user.is_verified:
            raise PermissionDenied("Only verified locals can post experiences.")
        serializer.save(local=user)

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