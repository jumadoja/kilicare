import os
from django.db import models
from django.conf import settings
from django.utils import timezone

class ChatRoom(models.Model):
    # 'DM' kwa chati ya watu 2, 'GROUP' kwa chati ya wengi
    ROOM_TYPES = (
        ('DM', 'Direct Message'),
        ('GROUP', 'Group Chat'),
    )
    
    name = models.CharField(max_length=255, unique=True, help_text="Mfano: user1_user2 au jina la group")
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES, default='DM')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.room_type}: {self.name}"

    class Meta:
        ordering = ['-updated_at']


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, 
        on_delete=models.CASCADE, 
        related_name='messages', 
        null=True, 
        blank=True
    )
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='received_messages'
    )
    
    content = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/%Y/%m/%d/', null=True, blank=True)
    
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    timestamp = models.DateTimeField(auto_now_add=True)
    
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Security & Housekeeping
    is_deleted = models.BooleanField(default=False) # Kwa ajili ya 'Delete for Everyone'
    
    # --- MPYA: SOFT DELETE LOGIC ---
    # Inaruhusu user kufuta chati upande wake bila kuathiri upande wa pili
    deleted_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='deleted_messages', 
        blank=True,
        help_text="Watumiaji waliofuta ujumbe huu upande wao."
    )

    def save(self, *args, **kwargs):
        if self.is_read and not self.read_at:
            self.read_at = timezone.now()
        if self.is_delivered and not self.delivered_at:
            self.delivered_at = timezone.now()
        super().save(*args, **kwargs)

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def mark_as_delivered(self):
        if not self.is_delivered:
            self.is_delivered = True
            self.delivered_at = timezone.now()
            self.save(update_fields=['is_delivered', 'delivered_at'])

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender.username} at {self.timestamp}"