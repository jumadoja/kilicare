from rest_framework import serializers
from .models import UserAIPreference, AIThread


class UserAIPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer ya kusave na kuretrieve mapendeleo ya user:
    - Lugha
    - Sauti
    - Interests
    """

    class Meta:
        model = UserAIPreference
        fields = ['preferred_voice', 'preferred_language', 'interests']

    def validate_interests(self, value):
        """
        Hakikisha interests ni list safi ya strings
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Interests lazima iwe list.")

        cleaned = []
        for item in value:
            if not isinstance(item, str):
                continue

            item_clean = item.strip().lower()
            if item_clean:
                cleaned.append(item_clean)

        return cleaned


class AIChatSerializer(serializers.Serializer):
    """
    Serializer kuu ya chat request:
    - message (text)
    - image (base64)
    - thread_id (UUID)
    """

    message = serializers.CharField(required=False, allow_blank=True)

    # 🔥 UUID (aligned na model)
    thread_id = serializers.UUIDField(required=False, allow_null=True)

    # Base64 string (temporary kabla ya upload)
    image = serializers.CharField(required=False, allow_null=True)

    def validate(self, data):
        message = data.get('message')
        image = data.get('image')

        # lazima kuwe na message AU image
        if not message and not image:
            raise serializers.ValidationError(
                "Lazima utume maandishi au picha."
            )

        # 🔥 sanitize message (aligned na view usage)
        if message:
            data['message'] = message.strip()

        # 🔥 normalize empty string image → None (important for view logic)
        if image == "":
            data['image'] = None
            image = None

        # 🔥 basic validation ya base64 (aligned na KilicareAIView)
        if image:
            if not isinstance(image, str):
                raise serializers.ValidationError(
                    "Image lazima iwe string ya base64."
                )

            if not image.startswith("data:image"):
                raise serializers.ValidationError(
                    "Image lazima iwe base64 sahihi (data:image/...)"
                )

            # optional safety: avoid extremely large payloads
            if len(image) > 5 * 1024 * 1024:  # ~5MB string
                raise serializers.ValidationError(
                    "Image ni kubwa sana."
                )

        return data


class AIThreadSerializer(serializers.ModelSerializer):
    """
    Serializer ya Threads (chat history sidebar)
    """

    # 🔥 last message preview
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AIThread
        fields = ['id', 'title', 'created_at', 'updated_at', 'last_message']

    def get_last_message(self, obj):
        """
        Rudisha message ya mwisho kwa preview UI
        """
        last = obj.messages.order_by('-timestamp').first()

        if not last:
            return ""

        # 🔥 handle image-only messages (aligned na model image_url)
        if last.content:
            return last.content[:80]

        if last.image_url:
            return "🖼️ Image"

        return ""