from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'message_text', 'created_at')
    search_fields = ('message_text', 'sender__username', 'chat__users__username')
    list_filter = ('created_at', 'sender')
    ordering = ('-created_at',)

    def chat(self, obj):
        """Display the ID of the associated chat."""
        return f"Chat {obj.chat.id}"
    chat.short_description = 'Chat ID'
