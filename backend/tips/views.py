from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.shortcuts import get_object_or_404

from .models import Tip
from .serializers import TipCreateSerializer, TipListSerializer

# ================= PERMISSIONS =================
class IsLocalUser(BasePermission):
    """
    Ruhusa Maalum: Ni watumiaji wenye role ya 'local' pekee 
    ndio wanaoweza kutengeneza (create) tips mpya.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, "role") and 
            request.user.role == "local"
        )


# ================= VIEWS =================

class CreateTipView(generics.CreateAPIView):
    """
    Endpoint kwa ajili ya 'Locals' kupost tips mpya (Safety, Food, Culture n.k).
    """
    serializer_class = TipCreateSerializer
    # Lazima awe amelogin NA awe ni 'local'
    permission_classes = [IsAuthenticated, IsLocalUser]

    def perform_create(self, serializer):
        # Hapa tuna-assign user aliyetengeneza tip moja kwa moja
        # kutoka kwenye request (ili asihitaji kujaza jina lake)
        serializer.save(created_by=self.request.user)


class ListTipsView(generics.ListAPIView):
    """
    Endpoint kwa ajili ya Tourists na Locals kuona tips zote.
    Inaleta tips ambazo ziko public tu, kuanzia mpya.
    """
    serializer_class = TipListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Kuleta data zote ambazo ni public na kupanga kwa kuanzia mpya
        queryset = Tip.objects.filter(is_public=True).order_by("-created_at")
        
        # (Bonus iliyoenda shule): Kama ukitaka kuchuja kwa category baadaye kwenye frontend
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__iexact=category)
            
        return queryset


class UpvoteTipView(APIView):
    """
    Endpoint kwa ajili ya ku-like/upvote tip. 
    Hii inaongeza engagement kwa tourists.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, tip_id):
        # Tunatafuta tip husika, kama haipo tunatupa 404
        tip = get_object_or_404(Tip, id=tip_id, is_public=True)
        
        # Ongeza upvote moja
        tip.upvotes += 1
        tip.save()
        
        return Response({
            "message": "Tip upvoted successfully!",
            "tip_id": tip.id,
            "new_upvotes": tip.upvotes
        }, status=status.HTTP_200_OK)