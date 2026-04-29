import requests
import json
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from .base_service import BaseService
from ..exceptions import (
    ValidationError,
    ServiceError,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class GenerateAIResponseService(BaseService):
    """Service for generating AI responses using Groq API"""
    
    def execute(self, user, message, thread_id=None, image_base64=None):
        """
        Generate AI response with context awareness
        """
        if not message and not image_base64:
            raise ValidationError("Message or image is required")
        
        from apps.ai.models import AIThread, AIActivity, UserAIPreference
        
        # Get or create thread
        safe_title = message[:150] if (message and message.strip()) else "Image Conversation"
        
        if thread_id:
            try:
                thread = AIThread.objects.get(id=thread_id, user=user)
            except (AIThread.DoesNotExist, ValueError):
                thread = AIThread.objects.create(user=user, title=safe_title)
        else:
            thread = AIThread.objects.create(user=user, title=safe_title)
        
        # Get user preferences
        prefs, _ = UserAIPreference.objects.get_or_create(user=user)
        user_role = getattr(user, 'role', 'user')
        user_interests = ", ".join(prefs.interests) if isinstance(prefs.interests, list) else ""
        language = prefs.get_preferred_language_display() if hasattr(prefs, 'get_preferred_language_display') else "English"
        
        # Get conversation history (last 12 messages)
        history_qs = AIActivity.objects.filter(thread=thread).order_by('-timestamp')[:12]
        history_messages = []
        
        if thread.summary:
            history_messages.append({"role": "system", "content": f"Previous context: {thread.summary}"})
        
        for h in reversed(history_qs):
            content_display = h.content if h.content else "[Image]"
            history_messages.append({"role": h.role, "content": content_display})
        
        # Build system prompt
        interest_prompt = f"User interests: {user_interests}. " if user_interests else ""
        system_instruction = (
            f"You are KilicareGO AI, an intelligent tourism assistant for Tanzania. "
            f"You are chatting with {user.username} who is a {user_role}. "
            f"{interest_prompt}"
            f"Primary language is {language}. "
            "Provide knowledgeable responses, use Markdown, and be friendly. Answer conversationally."
        )
        
        # Prepare content (text + image)
        image_url_for_db = None
        if image_base64:
            try:
                if "," in image_base64:
                    clean_image = image_base64.split(",")[1]
                else:
                    clean_image = image_base64
                
                selected_model = getattr(settings, "GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview")
                image_url_for_db = f"data:image/jpeg;base64,{clean_image}"
                
                user_content = [
                    {
                        "type": "text",
                        "text": message if (message and message.strip()) else "Describe this image in detail related to tourism or local life."
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url_for_db}
                    }
                ]
            except Exception as e:
                raise ValidationError("Invalid image data")
        else:
            user_content = message
            selected_model = getattr(settings, "GROQ_TEXT_MODEL", "llama-3.1-8b-instant")
        
        # Build API messages
        api_messages = (
            [{"role": "system", "content": system_instruction}]
            + history_messages
            + [{"role": "user", "content": user_content}]
        )
        
        # Save user message
        AIActivity.objects.create(
            thread=thread,
            user=user,
            role="user",
            content=message if (message and message.strip()) else "[User sent an image]",
            image_url=image_url_for_db
        )
        
        # Call Groq API
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": selected_model,
            "messages": api_messages,
            "temperature": 0.6,
            "stream": False,
        }
        
        try:
            response = requests.post(
                getattr(settings, "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"),
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                logger.error(f"Groq API error: {response.text}")
                raise ServiceError(f"AI service error: {response.text}")
            
            response_data = response.json()
            ai_response = response_data["choices"][0]["message"]["content"]
            
            # Save AI response
            AIActivity.objects.create(
                thread=thread,
                user=user,
                role="assistant",
                content=ai_response
            )
            
            # Update thread summary after 15 messages
            if AIActivity.objects.filter(thread=thread).count() > 15:
                thread.summary = ai_response[:500]
                thread.save()
            
            return {
                "response": ai_response,
                "thread_id": str(thread.id),
                "voice_preference": prefs.preferred_voice
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"AI request error: {str(e)}")
            raise ServiceError("Failed to connect to AI service")


class TranscribeAudioService(BaseService):
    """Service for transcribing audio using Whisper"""
    
    def execute(self, user, audio_file):
        """
        Transcribe audio file to text using Groq Whisper
        """
        if not audio_file:
            raise ValidationError("Audio file is required")
        
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
        files = {"file": audio_file}
        data = {"model": "whisper-large-v3"}
        
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            response.raise_for_status()
            
            user_text = response.json().get("text", "")
            
            # Get voice preference
            from apps.ai.models import UserAIPreference
            prefs, _ = UserAIPreference.objects.get_or_create(user=user)
            
            return {
                "user_text": user_text,
                "voice_preference": prefs.preferred_voice
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Audio transcription error: {str(e)}")
            raise ServiceError("Failed to transcribe audio")


class CreateProactiveAlertService(BaseService):
    """Service for creating proactive AI alerts"""
    
    def execute(self, user, alert_type, message):
        """
        Create a proactive alert for a user
        """
        from apps.ai.models import ProactiveAlert
        
        if alert_type not in ['weather', 'event', 'security']:
            raise ValidationError("Invalid alert type")
        
        alert = ProactiveAlert.objects.create(
            user=user,
            alert_type=alert_type,
            message=message
        )
        
        return alert


class GetUserAIThreadsService(BaseService):
    """Service for getting user's AI conversation threads"""
    
    def execute(self, user):
        """
        Get all AI threads for a user
        """
        from apps.ai.models import AIThread
        
        threads = AIThread.objects.filter(user=user).order_by('-updated_at')
        
        threads_data = []
        for thread in threads:
            last_message = thread.messages.order_by('-timestamp').first()
            
            threads_data.append({
                "id": str(thread.id),
                "title": thread.title,
                "summary": thread.summary,
                "created_at": thread.created_at,
                "updated_at": thread.updated_at,
                "last_message": last_message.content if last_message else None
            })
        
        return threads_data
