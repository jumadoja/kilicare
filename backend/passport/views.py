from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import PassportProfile, PassportBadge, UserBadge, PassportActivity
from .serializers import PassportProfileSerializer, PassportBadgeSerializer, UserBadgeSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MyPassportView(generics.RetrieveAPIView):
    serializer_class = PassportProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Ensure user has passport profile
        passport, created = PassportProfile.objects.get_or_create(user=self.request.user)
        return passport

class UserBadgesView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.badges.all()

class AwardPointsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Sample POST:
        {
            "action_type": "TIP_CREATED",
            "points": 10,
            "metadata": {"tip_id": 123}
        }
        """
        data = request.data
        passport, _ = PassportProfile.objects.get_or_create(user=request.user)

        action_type = data.get('action_type')
        points = data.get('points', 0)
        metadata = data.get('metadata', {})

        # Create activity
        activity = PassportActivity.objects.create(
            user=request.user,
            action_type=action_type,
            points_awarded=points,
            metadata=metadata
        )

        # Add points to passport
        passport.add_points(points)

        # Check badge unlocks
        badges = PassportBadge.objects.filter(criteria_points__lte=passport.points)
        for badge in badges:
            UserBadge.objects.get_or_create(user=request.user, badge=badge)

        return Response({
            "trust_score": passport.trust_score,
            "points": passport.points,
            "level": passport.level
        })
