from rest_framework import serializers
from .models import Chat, ChatMessage
from website.serializers import UserProfileSerializer
from website.models import User

class UserSerializer(serializers.ModelSerializer):
	id = serializers.ReadOnlyField()
	username = serializers.ReadOnlyField()
	status = serializers.ReadOnlyField()

	class Meta:
		model = User
		fields = ('id', 'username','status')


class ChatMessageSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)
	created_at = serializers.DateTimeField()

	class Meta:
		model = ChatMessage
		fields = ['id', 'sender', 'message_text', 'created_at']


class ChatSerializer(serializers.ModelSerializer):
	users = UserSerializer(many=True, read_only=True)
	messages = ChatMessageSerializer(many=True, read_only=True)
	created_at = serializers.DateTimeField()

	class Meta:
		model = Chat
		fields = ("id", "users", "messages", "created_at")
