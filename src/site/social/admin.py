from django.contrib import admin
from .models import Chat, ChatMessage

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_users', 'created_at')
    search_fields = ('users__username',)
    list_filter = ('created_at',)
    ordering = ('-created_at',)

    def get_users(self, obj):
        """Display a comma-separated list of chat participants."""
        return ", ".join([user.username for user in obj.users.all()])
    get_users.short_description = 'Users'

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat', 'sender', 'message_text', 'created_at')
    search_fields = ('message_text', 'sender__username', 'chat__users__username')
    list_filter = ('created_at', 'sender')
    ordering = ('-created_at',)

    def chat(self, obj):
        """Display the ID of the associated chat."""
        return f"Chat {obj.chat.id}"
    chat.short_description = 'Chat ID'
