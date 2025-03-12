from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from .models import LiarsBarMatch
from .serializers import LiarsBarMatchSerializer

class LastLiarsbarMatchView(APIView):

	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		
		try:
			last_match = LiarsBarMatch.objects.filter(
				Q(first_user=user) | Q(second_user=user) | Q(third_user=user) | Q(fourth_user=user)
			).last()
		except Exception as e:
			return Response({"server_error": f"{str(e)}"}, status=503)

		if last_match:
			serializer = LiarsBarMatchSerializer(last_match)
			return Response(serializer.data)
		
		return Response({"detail": "No matches found"}, status=status.HTTP_400_BAD_REQUEST)
