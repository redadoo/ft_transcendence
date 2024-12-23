from django.db import models
from django.conf import settings

class Chat(models.Model):
    id = models.AutoField(primary_key=True)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="chats",
        help_text="Users participating in this chat."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when the chat was created."
    )

    def __str__(self):
        return f"Chat between {', '.join([user.username for user in self.users.all()])}"

class ChatMessage(models.Model):
    id = models.AutoField(primary_key=True)
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="messages",
        help_text="Reference to the chat."
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        help_text="The user who sent this message."
    )
    message_text = models.TextField(
        help_text="The text of the message."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when the message was created."
    )

    def __str__(self):
        return f"Message by {self.sender.username} in Chat {self.chat.id}"
