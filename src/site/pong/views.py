from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q

class LastPongMatchView(APIView):

    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user

        last_match = PongMatch.objects.filter(
            Q(first_user=user) | Q(second_user=user)
        ).last()

        if last_match:
            serializer = PongMatchSerializer(last_match)
            return Response(serializer.data)
        return Response({"detail": "No matches found"}, status=status.HTTP_400_BAD_REQUEST)