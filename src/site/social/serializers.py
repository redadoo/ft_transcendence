from rest_framework import serializers
from .models import Chat, ChatMessage
from website.models import User

class UserSerializer(serializers.ModelSerializer):
	username = serializers.ReadOnlyField()

	class Meta:
		model = User
		fields = ('username',)


class ChatMessageSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)

	class Meta:
		model = ChatMessage
		fields = ['sender', 'message_text']


class ChatSerializer(serializers.ModelSerializer):
	users = serializers.SerializerMethodField()
	messages = ChatMessageSerializer(many=True, read_only=True)

	class Meta:
		model = Chat
		fields = ("users", "messages")

	def get_users(self, obj):
		request = self.context.get('request')
		if request and hasattr(request, 'user'):
			filtered_users = obj.users.exclude(username=request.user.username)
			return UserSerializer(filtered_users, many=True).data
		return UserSerializer(obj.users, many=True).data
