from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *
from .permissions import IsAdmin

# =====================
# MOMENTS
# =====================
class MomentViewSet(viewsets.ModelViewSet):
    queryset = KilicareMoment.objects.all().order_by('-created_at')
    serializer_class = MomentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        MomentLike.objects.get_or_create(user=request.user, moment=self.get_object())
        return Response({'status': 'liked'})

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        comment = MomentComment.objects.create(
            user=request.user,
            moment=self.get_object(),
            comment=request.data.get('comment')
        )
        return Response(CommentSerializer(comment).data)

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        SavedMoment.objects.get_or_create(user=request.user, moment=self.get_object())
        return Response({'status': 'saved'})

# =====================
# FOLLOW SYSTEM
# =====================
class FollowViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        Follow.objects.get_or_create(
            follower=request.user,
            following_id=request.data.get('user_id')
        )
        return Response({'status': 'followed'})

# =====================
# MUSIC
# =====================
class MusicViewSet(viewsets.ModelViewSet):
    queryset = BackgroundMusic.objects.all()
    serializer_class = MusicSerializer
    permission_classes = [IsAuthenticated]

# =====================
# ADMIN
# =====================
class AdminMomentViewSet(viewsets.ModelViewSet):
    queryset = KilicareMoment.objects.all()
    serializer_class = MomentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        moment = self.get_object()
        moment.is_verified = True
        moment.save()
        AdminActionLog.objects.create(
            admin=request.user,
            action='Approved moment',
            target_moment=moment,
            target_user=moment.posted_by
        )
        return Response({'status': 'approved'})
