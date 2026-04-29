from django.db import transaction
from .base_service import BaseService
from ..exceptions import ValidationError, NotFoundError

class CreateTipService(BaseService):
    """Service for creating local tips"""
    
    def execute(self, user, title, description, category, location, location_address=None):
        """
        Create a local tip with point awarding
        """
        if not title or len(title.strip()) == 0:
            raise ValidationError("Title is required")
        
        if not description or len(description.strip()) == 0:
            raise ValidationError("Description is required")
        
        with transaction.atomic():
            from apps.tips.models import Tip
            from apps.passport.models import PassportProfile
            
            # Create tip
            tip = Tip.objects.create(
                created_by=user,
                title=title,
                description=description,
                category=category,
                location=location,
                location_address=location_address
            )
            
            # Award points for creating tip
            passport, _ = PassportProfile.objects.get_or_create(user=user)
            passport.add_points(
                points=10,
                transaction_type='TIP_CREATED',
                description='Created a local tip',
                metadata={'tip_id': tip.id}
            )
            
            return tip


class VoteTipService(BaseService):
    """Service for voting on tips"""
    
    def execute(self, user, tip_id, vote_type):
        """
        Vote on a tip with trust score calculation
        """
        if vote_type not in ['upvote', 'downvote']:
            raise ValidationError("Invalid vote type")
        
        with transaction.atomic():
            from apps.tips.models import Tip, TipVote
            from apps.passport.models import PassportProfile
            
            tip = Tip.objects.get(id=tip_id)
            
            # Check if user already voted
            existing_vote = TipVote.objects.filter(user=user, tip=tip).first()
            
            if existing_vote:
                if existing_vote.vote_type == vote_type:
                    # Remove vote if clicking same type
                    existing_vote.delete()
                    if vote_type == 'upvote':
                        tip.upvotes -= 1
                    else:
                        tip.downvotes -= 1
                else:
                    # Change vote type
                    existing_vote.vote_type = vote_type
                    existing_vote.save()
                    if vote_type == 'upvote':
                        tip.upvotes += 1
                        tip.downvotes -= 1
                    else:
                        tip.downvotes += 1
                        tip.upvotes -= 1
            else:
                # Create new vote
                TipVote.objects.create(user=user, tip=tip, vote_type=vote_type)
                if vote_type == 'upvote':
                    tip.upvotes += 1
                else:
                    tip.downvotes += 1
            
            # Recalculate trust score
            tip.calculate_trust_score()
            tip.save()
            
            return tip
