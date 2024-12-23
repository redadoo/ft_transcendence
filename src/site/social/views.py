from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import ChatSerializer
from .models import Chat

class ChatView(APIView):
    """
    A view to retrieve all chats for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Retrieve all chats associated with the authenticated user.
        """
        # Fetch all chats that involve the authenticated user
        chats = Chat.objects.filter(users=request.user)

        # Serialize the chats with the ChatSerializer
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)
