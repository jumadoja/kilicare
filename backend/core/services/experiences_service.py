from django.db import transaction
from .base_service import BaseService
from ..exceptions import ValidationError, NotFoundError

class CreateExperienceService(BaseService):
    """Service for creating local experiences"""
    
    def execute(self, user, title, description, location, media_files=None, today_moment_active=False, today_moment_date=None):
        """
        Create a local experience with validation
        """
        if not title or len(title.strip()) == 0:
            raise ValidationError("Title is required")
        
        if not description or len(description.strip()) == 0:
            raise ValidationError("Description is required")
        
        # Only verified locals can post experiences
        if user.role != 'LOCAL' or not user.is_verified:
            raise ValidationError("Only verified locals can post experiences")
        
        with transaction.atomic():
            from apps.experiences.models import LocalExperience
            
            # Create experience
            experience = LocalExperience.objects.create(
                local=user,
                title=title,
                description=description,
                location=location,
                today_moment_active=today_moment_active,
                today_moment_date=today_moment_date
            )
            
            # Add media files if provided
            if media_files:
                experience.media_files.set(media_files)
            
            return experience
