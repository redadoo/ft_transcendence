import uuid
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
def start_singleplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
def start_multiplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pong_matchmaking(request):
	"""
	Handles matchmaking for Pong.
	"""

	# Fetch lobbies with available slots
	lobbies = PongMatch.objects.filter(second_user__isnull=True)

	#search best room matchmaking
	response_content = {}

	# If no lobbies are found, create a new one
	if not lobbies.exists():
		new_match = PongMatch.objects.create(
			first_user=request.user,
			start_date=now(),  # Start time is set to now
		)
		response_content['room'] = PongMatchSerializer(new_match).data
	else:
		# Join the first available lobby
		first_lobby = lobbies.first()
		if first_lobby.first_user == request.user:
			# If the user is already the first user, return the same lobby
			response_content['room'] = PongMatchSerializer(first_lobby).data
		else:
			# Assign the current user as the second user
			first_lobby.second_user = request.user
			first_lobby.save()
			response_content['room'] = PongMatchSerializer(first_lobby).data

	return Response(response_content)

