from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .permissions import IsAdminUser
from apps.tips.models import Tip
from apps.kilicaremoments.models import KilicareMoment
from apps.ai.models import AIActivity
from apps.users.models import User
from .serializers import (
    UserSerializer, TipModerateSerializer,
    MomentModerateSerializer, AIActivitySerializer
)

# Users
class LocalUsersListView(generics.ListAPIView):
    queryset = User.objects.filter(role='LOCAL')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class VerifyLocalUserView(generics.UpdateAPIView):
    queryset = User.objects.filter(role='LOCAL')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_verified = True
        user.save()
        return Response({'message': f'User {user.username} verified successfully'})


# Tips moderation
class TipListAdminView(generics.ListAPIView):
    queryset = Tip.objects.all()
    serializer_class = TipModerateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class TipModerateView(generics.UpdateAPIView):
    queryset = Tip.objects.all()
    serializer_class = TipModerateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, *args, **kwargs):
        tip = self.get_object()
        is_public = request.data.get('is_public')
        if is_public is not None:
            tip.is_public = bool(is_public)
            tip.save()
        return Response({'message': f'Tip "{tip.title}" moderation updated', 'is_public': tip.is_public})


# Moments moderation
class MomentListAdminView(generics.ListAPIView):
    queryset = KilicareMoment.objects.all()
    serializer_class = MomentModerateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class MomentModerateView(generics.UpdateAPIView):
    queryset = KilicareMoment.objects.all()
    serializer_class = MomentModerateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, *args, **kwargs):
        moment = self.get_object()
        is_public = request.data.get('is_public')
        if is_public is not None:
            moment.is_public = bool(is_public)
            moment.save()
        return Response({'message': f'Moment "{moment.caption}" moderation updated', 'is_public': moment.is_public})


# AI Logs
class AIActivityListView(generics.ListAPIView):
    queryset = AIActivity.objects.all().order_by('-timestamp')  # <-- badilisha hapa
    serializer_class = AIActivitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]