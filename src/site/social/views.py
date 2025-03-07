from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from website.models import Friendships
from django.db.models import Q
from .serializers import FriendshipSerializer

class ChatView(APIView):
	"""
	A view to retrieve all chats for the authenticated user.
	"""
	permission_classes = [IsAuthenticated]

	def get(self, request, *args, **kwargs):
		"""
		Retrieve all chats associated with the authenticated user.
		"""
		user = request.user

		try:
			# Retrieve all chats where the user is either first or second user
			chats = Friendships.objects.filter(
				Q(first_user=user) | Q(second_user=user)
			).prefetch_related('messages__sender')

			# Serialize the retrieved chat data
			serializer = FriendshipSerializer(chats, many=True, context={'request': request})
			return Response(serializer.data)

		except Exception as e:
			return Response({"server_error": f"{str(e)}"}, status=503)