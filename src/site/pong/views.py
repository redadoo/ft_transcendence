import uuid

from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from .consumer import match_manager
from utilities.lobby import Lobby
from .scripts.PongGameManager import PongGameManager


class PongInitView(APIView):
	# permission_classes = [IsAuthenticated]

	def post(self, request):
		"""
		create a new game.
		"""
		
		room_name = str(uuid.uuid4())
		match: Lobby = match_manager.create_match("pong", room_name, PongGameManager(), "Lobby")
		match.add_player_to_lobby({"player_id": "-1"}, False)
		match.mark_player_ready("-1")
		return Response({"room_name": room_name, "lobby_info": match.to_dict()}, status=status.HTTP_201_CREATED)

class PongPlayerControlView(APIView):
	# permission_classes = [IsAuthenticated]

	def post(self, request):
		"""
		Updates player controls.
		Expected payload: {
			"room_name": <room_name>,
			"player_id": <player_id>,
			'action_type': '<action_type>', 
			'key': '<key_pressed>', 
		}
		"""
		room_name = request.data.get('room_name')
		match = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)
		try:
			match.game_manager.update_player(request.data)
		except Exception as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
		return Response({"lobby_info": match.to_dict()}, status=status.HTTP_200_OK)

class PongGameStateView(APIView):
	# permission_classes = [IsAuthenticated]

	def get(self, request):
		"""
		Retrieves the current game state.
		Expects a query parameter: ?room_name=<room_name>
		"""
		room_name = request.query_params.get('room_name')
		match = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

		return Response({
			"lobby_info": match.to_dict()
		}, status=status.HTTP_200_OK) 

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