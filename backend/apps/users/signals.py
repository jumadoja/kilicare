from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """
    Log user creation events only.
    Profile creation is handled in UserSerializer.create() to ensure
    atomic transaction and single source of truth.
    """
    if created:
        logger.info(f"User created: {instance.username} (ID: {instance.id}, Role: {instance.role})")
