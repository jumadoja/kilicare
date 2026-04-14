import requests
import json
import logging
from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.shortcuts import get_object_or_404

from .models import AIThread, AIActivity, UserAIPreference, ProactiveAlert
from .serializers import AIChatSerializer, UserAIPreferenceSerializer, AIThreadSerializer

logger = logging.getLogger(__name__)

class KilicareAIView(APIView):
    """
    Main View ya Kilicare AI. 
    Inasapoti Streaming, Image Vision, na Memory Compression.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = AIChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data.get("message", "")
        image_base64 = serializer.validated_data.get("image")
        thread_id = serializer.validated_data.get("thread_id")

        # 1. MEMORY & SESSION MANAGEMENT
        # Title isizidi 200 kwa usalama wa DB
        safe_title = message[:150] if (message and message.strip()) else "Mazungumzo ya Picha"
        
        if thread_id:
            try:
                thread = AIThread.objects.get(id=thread_id, user=user)
            except (AIThread.DoesNotExist, ValueError):
                thread = AIThread.objects.create(user=user, title=safe_title)
        else:
            thread = AIThread.objects.create(user=user, title=safe_title)

        # 2. USER PREFERENCES
        prefs, _ = UserAIPreference.objects.get_or_create(user=user)
        user_role = getattr(user, 'role', 'mtumiaji')
        user_interests = ", ".join(prefs.interests) if isinstance(prefs.interests, list) else ""
        language = prefs.get_preferred_language_display() if hasattr(prefs, 'get_preferred_language_display') else "Kiswahili"
        
        # 3. ADVANCED MEMORY (Last 12 messages)
        history_qs = AIActivity.objects.filter(thread=thread).order_by('-timestamp')[:12]
        history_messages = []
        
        if thread.summary:
            history_messages.append({"role": "system", "content": f"Kumbukumbu ya nyuma: {thread.summary}"})
            
        for h in reversed(history_qs):
            # Kama kuna picha huko nyuma, tunaikumbusha AI kuwa kulikuwa na picha
            content_display = h.content if h.content else "[Picha]"
            history_messages.append({"role": h.role, "content": content_display})

        # 4. SYSTEM PROMPT
        interest_prompt = f"Mtumiaji anapenda: {user_interests}. " if user_interests else ""
        system_instruction = (
            f"Wewe ni KilicareGO AI, msaidizi mwerevu wa utalii nchini Tanzania. "
            f"Unazungumza na {user.username} ambaye ni {user_role}. "
            f"{interest_prompt}"
            f"Lugha kuu ya mazungumzo ni {language}. "
            "Toa majibu yenye weledi, tumia Markdown, na uwe mchangamfu. Jibu kwa kutiririka (streaming)."
        )

        # 5. CONTENT PREPARATION (IMAGE & TEXT LOGIC)
        image_url_for_db = None
        if image_base64:
            # Safisha Base64 (Ondoa metadata kama ipo)
            try:
                if "," in image_base64:
                    clean_image = image_base64.split(",")[1]
                else:
                    clean_image = image_base64
                
                # ✅ MABADILIKO YAPO HAPA: Inasoma Vision Model kutoka settings.py
                selected_model = getattr(settings, "GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview") 
                image_url_for_db = f"data:image/jpeg;base64,{clean_image}"
                
                user_content = [
                    {
                        "type": "text",
                        "text": message if (message and message.strip()) else "Nieleze picha hii kwa undani kuhusiana na utalii au maisha ya hapa."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url_for_db
                        }
                    }
                ]
            except Exception as e:
                return Response({"error": "Picha ina hitilafu"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            user_content = message
            # ✅ MABADILIKO YAPO HAPA: Inasoma Text Model kutoka settings.py
            selected_model = getattr(settings, "GROQ_TEXT_MODEL", "llama-3.1-8b-instant")

        api_messages = (
            [{"role": "system", "content": system_instruction}]
            + history_messages
            + [{"role": "user", "content": user_content}]
        )

        # SAVE USER MESSAGE TO DATABASE
        AIActivity.objects.create(
            thread=thread, 
            user=user, 
            role="user", 
            content=message if (message and message.strip()) else "[Mtumiaji ametuma picha]", 
            image_url=image_url_for_db
        )

        def sse_event(data: dict):
            return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

        # 6. STREAMING GENERATOR
        def stream_generator():
            full_reply = ""
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": selected_model,
                "messages": api_messages,
                "temperature": 0.6,
                "stream": True,
            }

            try:
                # Meta data kwa Frontend
                yield sse_event({
                    "thread_id": str(thread.id),
                    "voice_preference": prefs.preferred_voice
                })

                response = requests.post(
                    getattr(settings, "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"),
                    headers=headers, 
                    json=payload, 
                    stream=True, 
                    timeout=60
                )

                if response.status_code != 200:
                    yield sse_event({"error": f"Groq Error: {response.text}"})
                    return

                for line in response.iter_lines():
                    if not line: continue
                    
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith("data: "):
                        content_str = decoded_line[6:]
                        if content_str.strip() == "[DONE]": break
                        
                        try:
                            chunk = json.loads(content_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content")

                            if content:
                                full_reply += content
                                yield sse_event({"content": content})
                        except json.JSONDecodeError:
                            continue

                # 7. SAVE ASSISTANT REPLY
                if full_reply.strip():
                    AIActivity.objects.create(
                        thread=thread, user=user, role="assistant", content=full_reply
                    )
                    # Update summary baada ya meseji 15 (kwa utendaji mzuri)
                    if AIActivity.objects.filter(thread=thread).count() > 15:
                        thread.summary = full_reply[:500]
                        thread.save()

            except Exception as e:
                logger.error(f"AI Stream Error: {str(e)}")
                yield sse_event({"error": "Tatizo la kiufundi limetokea"})

        # 8. RESPONSE
        response = StreamingHttpResponse(stream_generator(), content_type='text/event-stream')
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class VoiceToTextView(APIView):
    permission_classes = [IsAuthenticated]

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

    def get_object(self):
        obj, _ = UserAIPreference.objects.get_or_create(user=self.request.user)
        return obj


class AIThreadListView(generics.ListAPIView):
    serializer_class = AIThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIThread.objects.filter(user=self.request.user).order_by('-updated_at')


class ProactiveAlertListView(APIView):
    permission_classes = [IsAuthenticated]

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