from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from django.utils import timezone

@receiver(post_save, sender=Message)
def update_room_timestamp(sender, instance, created, **kwargs):
    """
    Kila meseji mpya inapookolewa (created), tunasogeza ChatRoom 
    mbele kwenye list kwa ku-update 'updated_at' field.
    """
    if created:
        try:
            # Tunachukua room ya meseji husika
            room = instance.room
            # Tunatumia timestamp ya meseji kama muda mpya wa room
            room.updated_at = instance.timestamp
            # Tunatumia update_fields kusaidia database iwe fasta zaidi
            room.save(update_fields=['updated_at'])
        except Exception as e:
            # Hii inazuia app isi-crash kama kuna tatizo kwenye signal
            print(f"Error updating room timestamp: {e}")