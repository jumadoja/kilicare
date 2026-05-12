from django.db import transaction
from .base_service import BaseService
from ..exceptions import ValidationError, NotFoundError

class CreateMomentService(BaseService):
    """Service for creating Kilicare moments"""

    def execute(self, user, caption, media_type, media_file, visibility='PUBLIC', latitude=None, longitude=None, background_music=None):
        """
        Create a Kilicare moment with point awarding
        """
        if not media_file:
            raise ValidationError("Media file is required")

        if media_type not in ['image', 'video', 'IMAGE', 'VIDEO']:
            raise ValidationError("Invalid media type")

        if visibility not in ['PUBLIC', 'FOLLOWERS', 'PRIVATE']:
            raise ValidationError("Invalid visibility setting")

        with transaction.atomic():
            from apps.kilicaremoments.models import KilicareMoment
            from apps.passport.models import PassportProfile

            # Create moment
            moment = KilicareMoment.objects.create(
                posted_by=user,
                caption=caption,
                media_type=media_type.lower() if isinstance(media_type, str) else media_type,
                media=media_file,
                visibility=visibility,
                latitude=latitude,
                longitude=longitude,
                background_music=background_music
            )

            # Award points for posting moment
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=15,
                transaction_type='MOMENT_POSTED',
                description='Posted a Kilicare moment',
                metadata={'moment_id': moment.id}
            )

            return moment


class LikeMomentService(BaseService):
    """Service for liking/unliking moments"""
    
    def execute(self, user, moment_id):
        """
        Like or unlike a moment with point awarding
        """
        from apps.kilicaremoments.models import KilicareMoment, MomentLike
        from apps.passport.models import PassportProfile
        
        moment = KilicareMoment.objects.get(id=moment_id)
        like, created = MomentLike.objects.get_or_create(user=user, moment=moment)
        
        if not created:
            # Unlike if already liked
            like.delete()
            return {'status': 'unliked', 'is_liked': False, moment: moment}
        else:
            # Award points for engagement
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=2,
                transaction_type='MOMENT_LIKED',
                description='Liked a moment',
                metadata={'moment_id': moment.id}
            )
            
            moment.calculate_trending_score()
            return {'status': 'liked', 'is_liked': True, moment: moment}


class CommentMomentService(BaseService):
    """Service for commenting on moments"""
    
    def execute(self, user, moment_id, comment_text):
        """
        Add comment to a moment with point awarding
        """
        if not comment_text or len(comment_text.strip()) == 0:
            raise ValidationError("Comment cannot be empty")
        
        with transaction.atomic():
            from apps.kilicaremoments.models import KilicareMoment, MomentComment
            from apps.passport.models import PassportProfile
            
            moment = KilicareMoment.objects.get(id=moment_id)
            
            # Create comment
            comment = MomentComment.objects.create(
                user=user,
                moment=moment,
                comment=comment_text
            )
            
            # Award points for commenting
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=3,
                transaction_type='MOMENT_COMMENTED',
                description='Commented on a moment',
                metadata={'moment_id': moment.id}
            )
            
            moment.calculate_trending_score()
            return comment
