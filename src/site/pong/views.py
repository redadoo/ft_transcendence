import uuid
from asgiref.sync import async_to_sync
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from .consumer import match_manager
from utilities.lobby import Lobby
from utilities.Tournament import Tournament
from .scripts.PongGameManager import PongGameManager
from website.models import User

class PongPlayersList(APIView):
	def get(self, request):
		room_name = request.query_params.get('room_name')
		match = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

		if isinstance(match, Lobby):
			players =  match.to_dict().get("players", {})
			player_ids = list(players.keys())
		elif isinstance(match, Tournament):
			players =  match.to_dict().get("tournament_players", {})
			player_ids = list(players)
		usernames = []
		for pid in player_ids:
			try:
				user = User.objects.get(id=int(pid))
				usernames.append(user.username)
			except (User.DoesNotExist, ValueError):
				usernames.append("Unknown")
		usernames.reverse()
		return Response({"usernames": usernames}, status=status.HTTP_200_OK)

class PongRoomState(APIView):
	def post(self, request):

		room_name = request.data.get('room_name')
		match: Lobby = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)
		return Response({"lobby_info": match.to_dict()}, status=status.HTTP_201_CREATED)

class PongCheckLobby(APIView):

	def get(self, request):
		room_name: str = request.query_params.get('room_name')

		if not room_name:
			return Response(
				{"success": "false", "error": "room_name parameter is required."},
				status=status.HTTP_400_BAD_REQUEST
			)

		match = match_manager.get_match(room_name)
		if not match:
			return Response({"success": "false"}, status=status.HTTP_404_NOT_FOUND)

		if not match.game_manager.players:
			return Response(
				{"success": "false", "error": "No players in the lobby."},
				status=status.HTTP_404_NOT_FOUND
			)

		host_id = next(iter(match.game_manager.players.keys()))

		try:
			host_username = User.objects.values_list('username', flat=True).get(id=host_id)
		except User.DoesNotExist:
			return Response(
				{"success": "false", "error": "Host not found."},
				status=status.HTTP_404_NOT_FOUND
			)

		return Response(
			{"success": "true", "host": host_username},
			status=status.HTTP_200_OK
		)

class PongStartLobbyView(APIView):
	def post(self, request):

		room_name = request.data.get('room_name')
		match: Lobby = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

		if len(match.game_manager.players) != 2:
			return Response({"error": "not enough player."}, status=status.HTTP_404_NOT_FOUND)

		async_to_sync(match.force_player_ready)()
		async_to_sync(match.start_game)()
		return Response({"lobby_info": match.to_dict()}, status=status.HTTP_201_CREATED)

class PongInitView(APIView):
	# permission_classes = [IsAuthenticated]
	def post(self, request):
		"""
		Create a new game.
		"""
		room_name = str(uuid.uuid4())
		match: Lobby = match_manager.create_match("pong", room_name, PongGameManager(), "Lobby")

		# Wrap asynchronous calls to run synchronously
		async_to_sync(match.add_player_to_lobby)({"player_id": "-1"}, False)
		async_to_sync(match.mark_player_ready)({"player_id": "-1"})

		return Response(
			{"room_name": room_name, "lobby_info": match.to_dict()},
			status=status.HTTP_201_CREATED
		)

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
		match: Lobby = match_manager.get_match(room_name)
		if not match:
			return Response({"error": "Match not found."}, status=status.HTTP_404_NOT_FOUND)
		try:
			match.game_manager.players[-1].update_player_data(request.data)
		except Exception as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
		return Response({"lobby_info": match.to_dict()}, status=status.HTTP_200_OK)

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