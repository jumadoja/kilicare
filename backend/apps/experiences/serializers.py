from rest_framework import serializers
from django.utils import timezone
from .models import LocalExperience, ExperienceMedia

class ExperienceMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceMedia
        fields = ['id', 'file', 'media_type', 'uploaded_at']

class LocalExperienceSerializer(serializers.ModelSerializer):
    media_files = ExperienceMediaSerializer(many=True, read_only=True)
    first_image = serializers.SerializerMethodField()
    
    # Inapokea picha/video nyingi kutoka Frontend (Multipart Form Data)
    uploaded_media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = LocalExperience
        fields = [
            'id', 'title', 'description', 'location', 'category', 
            'cultural_moment', 'availability', 'price_range', 
            'today_moment_text', 'today_moment_active', 
            'today_moment_date', 'media_files', 
            'first_image', 'uploaded_media', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_first_image(self, obj):
        # Inatafuta picha ya kwanza tu kwa ajili ya preview ya haraka
        first_media = obj.media_files.filter(media_type='image').first()
        return first_media.file.url if first_media else None

    def handle_media_upload(self, experience, files):
        """Logic ya kuchakata picha na video nyingi"""
        for file in files:
            # TWIST 1: Ulinzi wa size ya file (Mwisho 20MB)
            if file.size > 20 * 1024 * 1024:
                raise serializers.ValidationError(f"File {file.name} ni kubwa sana. Limit ni 20MB.")
            
            # Utambuzi wa aina ya file (Image vs Video)
            content_type = file.content_type
            if content_type.startswith('video'):
                m_type = 'video'
            elif content_type.startswith('image'):
                m_type = 'image'
            else:
                continue # Skip files ambazo sio media

            ExperienceMedia.objects.create(
                experience=experience,
                file=file,
                media_type=m_type
            )

    def create(self, validated_data):
        files = validated_data.pop('uploaded_media', [])
        # TWIST 2: Assign tarehe ya leo kama haipo
        if not validated_data.get('today_moment_date'):
            validated_data['today_moment_date'] = timezone.localdate()

        experience = LocalExperience.objects.create(**validated_data)
        self.handle_media_upload(experience, files)
        return experience

    def update(self, instance, validated_data):
        # TWIST 4: Bulk Update (Inaongeza media mpya bila kufuta za zamani)
        files = validated_data.pop('uploaded_media', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if files:
            self.handle_media_upload(instance, files)
        return instance