from rest_framework import serializers
from .models import ChatMessage
from website.models import User, Friendships

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


class FriendshipSerializer(serializers.ModelSerializer):
	users = serializers.SerializerMethodField()
	messages = ChatMessageSerializer(many=True, read_only=True)

	class Meta:
		model = Friendships
		fields = ['id', 'status', 'users', 'messages', 'date_created']

	def get_users(self, obj):
		# Get the requesting user from the serializer context
		request_user = self.context['request'].user
		
		# Filter out the requesting user
		other_user = [user for user in [obj.first_user, obj.second_user] if user != request_user]
		
		# Serialize the other user
		return UserSerializer(other_user, many=True).data
