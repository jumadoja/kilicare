import requests
import json
import logging
from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.views import CookieJWTAuthentication
from django.conf import settings
from django.shortcuts import get_object_or_404

from .models import AIThread, AIActivity, UserAIPreference, ProactiveAlert
from .serializers import AIChatSerializer, UserAIPreferenceSerializer, AIThreadSerializer
from core.services.ai_service import GenerateAIResponseService

logger = logging.getLogger(__name__)

class KilicareAIView(APIView):
    """
    Main View ya Kilicare AI. 
    Inasapoti JSON Response, Image Vision, na Memory Compression.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        user = request.user
        serializer = AIChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data.get("message", "")
        image_base64 = serializer.validated_data.get("image")
        thread_id = serializer.validated_data.get("thread_id")

        # Use service layer for AI response generation
        service = GenerateAIResponseService(
            user=user,
            message=message,
            image_base64=image_base64,
            thread_id=thread_id
        )
        
        # Get JSON response from service
        response_data = service.execute()
        return Response(response_data)


class VoiceToTextView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        audio_file = request.FILES.get("audio")
        thread_id = request.data.get("thread_id")

        if not audio_file:
            return Response({"error": "Sauti haikupatikana"}, status=status.HTTP_400_BAD_REQUEST)

        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
        files = {"file": audio_file}
        data = {"model": "whisper-large-v3"}

        try:
            whisper_res = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers=headers, files=files, data=data, timeout=30
            )
            whisper_res.raise_for_status()
            user_text = whisper_res.json().get("text", "")
            
            # Pata voice preference
            prefs, _ = UserAIPreference.objects.get_or_create(user=request.user)
            
            return Response({
                "user_text": user_text,
                "thread_id": thread_id,
                "voice_preference": prefs.preferred_voice
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = UserAIPreferenceSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get_object(self):
        obj, _ = UserAIPreference.objects.get_or_create(user=self.request.user)
        return obj


class AIThreadListView(generics.ListAPIView):
    serializer_class = AIThreadSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get_queryset(self):
        return AIThread.objects.filter(user=self.request.user).order_by('-updated_at')


class ProactiveAlertListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get(self, request):
        alerts = ProactiveAlert.objects.filter(user=request.user).order_by('-created_at')[:5]
        data = [
            {
                "id": a.id, 
                "message": a.message, 
                "type": a.alert_type, 
                "created_at": a.created_at
            } for a in alerts
        ]
        return Response(data)