from django.db import models
from django.conf import settings
from website.models import Friendships

class ChatMessage(models.Model):
    id = models.AutoField(primary_key=True)
    friendship = models.ForeignKey(
        Friendships,
        on_delete=models.CASCADE,
        related_name="messages",
        help_text="Reference to the friendship."
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
        return f"Message by {self.sender.username} in Friendship {self.friendship.id}"
