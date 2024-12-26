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

        include = request.query_params.getlist('with')

        if include:
            chats = Chat.objects.filter(users__username__in=include)
        else:
            chats = Chat.objects.filter(users=request.user)

        serializer = ChatSerializer(chats, many=True, context={'request': request})
        return Response(serializer.data)