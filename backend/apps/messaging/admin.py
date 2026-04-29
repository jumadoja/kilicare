from django.contrib import admin
from .models import Message, ChatRoom

class MessageInline(admin.TabularInline):
    """
    Inaruhusu kuona meseji ndani ya ChatRoom moja kwa moja
    """
    model = Message
    # Tunatumia 'room' kama foreign key badala ya 'sender' ili kuona chati nzima
    fk_name = 'room' 
    extra = 0
    readonly_fields = ('timestamp', 'is_delivered', 'delivered_at', 'is_read', 'read_at')
    fields = ('sender', 'receiver', 'content', 'timestamp', 'is_delivered', 'is_read')

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_type', 'created_at', 'updated_at')
    list_filter = ('room_type', 'created_at')
    # Badala ya 'members', tunatumia 'participants' kama ilivyo kwenye Model
    filter_horizontal = ('participants',)
    search_fields = ('name',)
    inlines = [MessageInline]

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    # Majina ya fields yamebadilishwa kulingana na model yetu (is_delivered, is_read)
    list_display = ('sender', 'room', 'content_excerpt', 'timestamp', 'is_delivered', 'is_read', 'is_deleted')
    list_filter = ('room', 'is_delivered', 'is_read', 'is_deleted', 'timestamp')
    search_fields = ('sender__username', 'content')
    readonly_fields = ('timestamp', 'delivered_at', 'read_at')
    
    def content_excerpt(self, obj):
        """Inaonyesha kipande kidogo cha meseji ili admin list isizidiwe"""
        if obj.content:
            return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
        return "[Attachment]"
    content_excerpt.short_description = 'Message Content'