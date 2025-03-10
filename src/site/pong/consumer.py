import json
import uuid

from utilities.lobby import Lobby
from website.models import User
from utilities.Tournament import Tournament
from channels.db import database_sync_to_async
from utilities.MatchManager import MatchManager
from ft_transcendence.consumer import BaseConsumer
from pong.scripts.PongGameManager import PongGameManager
from website.serializers import SimpleUserProfileSerializer
from channels.generic.websocket import AsyncWebsocketConsumer

class PongMatchmaking(AsyncWebsocketConsumer):
	matchmaking_queue = set()
	room_group_name = "pong_matchmaking"

	async def connect(self):
		"""Handles WebSocket connection"""
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()
		print(f"Player connected: {self.channel_name}")

	async def disconnect(self, close_code):
		"""Handles WebSocket disconnection"""
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		self.matchmaking_queue.discard(self.channel_name)
		print(f"Player disconnected: {self.channel_name}")

	async def receive(self, text_data):
		"""Handles messages received from WebSocket clients"""
		request = json.loads(text_data)
		action = request.get("action")

		if action == "join_matchmaking":
			if self.channel_name in self.matchmaking_queue:
				print(f"Player {self.channel_name} is already in the matchmaking queue.")
				return
			
			self.matchmaking_queue.add(self.channel_name)
			print(f"Player {self.channel_name} joined matchmaking. Queue size: {len(self.matchmaking_queue)}")
			await self.check_for_match()

	async def check_for_match(self):
		"""Checks if there are enough players to create a match"""
		while len(self.matchmaking_queue) >= 2:
			player1 = self.matchmaking_queue.pop()
			player2 = self.matchmaking_queue.pop()

			room_name = str(uuid.uuid4())
			print(f"Match found: {player1} vs {player2} | Room: {room_name}")

			await self.channel_layer.send(
				player1,
				{
					"type": "send.match.found",
					"room_name": room_name,
				}
			)
			await self.channel_layer.send(
				player2,
				{
					"type": "send.match.found",
					"room_name": room_name,
				}
			)

	async def send_match_found(self, event):
		"""Sends match found event to a player"""
		room_name = event["room_name"]
		await self.send(text_data=json.dumps({
			"type": "setup_pong_lobby",
			"room_name": room_name
		}))

match_manager = MatchManager()

class PongMultiplayerConsumer(BaseConsumer):
	async def connect(self):
		self.user_id = self.scope["user"].id
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]

		self.lobby: Lobby = match_manager.get_match(self.room_name)
		if self.lobby is None:
			self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(), "lobby")

		await self.join_group(self.lobby.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.lobby:
			await self.leave_group(self.lobby.room_group_name)

	async def handle_event(self, data: dict):
		if self.lobby:
			await self.lobby.manage_event(data)

class PongSingleplayerConsumer(BaseConsumer):
	def generate_random_room_name(self) -> str:
		room_components = [str(v) for v in self.scope["url_route"]["kwargs"].values()]
		room_components.append(str(uuid.uuid4()))
		return "_".join(room_components)

	async def connect(self):
		self.room_name = self.generate_random_room_name()
		self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(), "Lobby")

		await self.join_group(self.lobby.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.lobby:
			await self.leave_group(self.lobby.room_group_name)

	async def handle_event(self, data: dict):
		event_type = data.get("type")

		if event_type == "init_player":
			self.useBot = data.get("mode") == "vs_bot"
			
			await self.lobby.manage_event(data)

			if self.useBot:
				await self.lobby.add_player_to_lobby({"player_id": "-1"}, True)
			else:
				await self.lobby.add_player_to_lobby({"player_id": "-1"}, False)
			
			await self.lobby.mark_player_ready({"player_id": "-1"})
		else:
			await self.lobby.manage_event(data)

class PongLobbyConsumer(BaseConsumer):
	async def connect(self):
		self.user = self.scope["user"]
		self.user_id = self.user.id
		self.room_name = self.scope["url_route"]["kwargs"].get("room_name")

		# If no room_name is provided, generate one and notify via the social channel(for manage lobby invite).
		if self.room_name is None:
			self.room_name = str(uuid.uuid4())
			await self.send_to_social({
				"type": "send_pong_lobby",
				"room_name": self.room_name,
			})

		self.lobby: Lobby = match_manager.get_match(self.room_name)
		if self.lobby is None:
			self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(), "lobby")

		await self.join_group(self.lobby.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.lobby:
			await self.leave_group(self.lobby.room_group_name)

	async def handle_event(self, data: dict):
		event_type = data.get("type")
		if event_type == "client_ready":
			await self.lobby.broadcast_message({
				"type": "lobby_state",
				"event_name": "host_started_game",
			})

		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		if event.get("event_name") == "player_join" and event.get("player_id"):
			try:
				user = await database_sync_to_async(User.objects.get)(id=event["player_id"])
			except Exception as e:
				raise ValueError(f"error while retrieving user: {str(e)}")
			await self.send_to_social({
				"type": "user_join_lobby",
				"username": user.username,
			})
		await super().lobby_state(event)

class PongTournament(BaseConsumer):
	async def connect(self):
		self.user = self.scope["user"]
		self.user_id = self.user.id
		self.room_name = self.scope["url_route"]["kwargs"].get("room_name")

		if self.room_name is None:
			self.room_name = str(uuid.uuid4())
			await self.send_to_social({
				"type": "send_pong_tournament",
				"room_name": self.room_name,
			})

		self.tournament: Tournament = match_manager.get_match(self.room_name)
		if self.tournament is None:
			self.tournament: Tournament = match_manager.create_match("pong", self.room_name, PongGameManager(), "tournament")

		await self.join_group(self.tournament.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.tournament:
			await self.leave_group(self.tournament.room_group_name)

	async def handle_event(self, data: dict):
		await self.tournament.manage_event(data)

	@database_sync_to_async
	def get_serialized_user(self, player_id):
		"""Fetches user and serializes data in a synchronous context."""
		try:
			user = User.objects.get(id=player_id)
			serializer = SimpleUserProfileSerializer(user)
			return user.username, serializer.data.get("image_url")
		except User.DoesNotExist:
			return None, None

	async def lobby_state(self, event: dict):
		if event.get("event_name") == "player_join" and event.get("player_id"):
			try:
				username, image_url = await self.get_serialized_user(event["player_id"])
				if not username:
					raise ValueError("User not found")

				await self.send_to_social({
					"type": "user_join_tournament",
					"username": username,
					"user_image": image_url
				})
			except Exception as e:
				raise ValueError(f"Error while retrieving user: {str(e)}")
		else:
			await self.safe_send({
				"event_info": event,
				"lobby_info": event.get("tournament_snapshot") or self.tournament.to_dict(),
			})
