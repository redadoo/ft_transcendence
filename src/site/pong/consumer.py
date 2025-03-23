import json
import uuid
import time

from utilities.lobby import Lobby
from website.models import User, UserStats
from utilities.Tournament import Tournament
from channels.db import database_sync_to_async
from utilities.MatchManager import MatchManager
from ft_transcendence.consumer import BaseConsumer
from pong.scripts.PongGameManager import PongGameManager
from channels.generic.websocket import AsyncWebsocketConsumer

match_manager = MatchManager()
LOBBY_NAME = "lobby"
TOURNAMENT_NAME = "tournament"

class PongMatchmaking(AsyncWebsocketConsumer):
	base_mmr_gap = 20
	max_mmr_gap = 100
	matchmaking_queue = list()
	room_group_name = "pong_matchmaking"

	async def connect(self):
		"""Handles WebSocket connection"""
		self.user = self.scope["user"]
		self.user_id = self.user.id

		user = await database_sync_to_async(User.objects.get)(id=self.user_id)
		user_stat: UserStats = await database_sync_to_async(UserStats.objects.get)(user=user)
		self.user_mmr = user_stat.mmr
		self.join_time = time.time()

		self.user_object = {
			'channel_name': self.channel_name,
			'user_id': self.user_id,
			'mmr': self.user_mmr
		}

		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()

		print(f"Player connected: {self.user_id} | MMR: {self.user_mmr}")

	async def disconnect(self, close_code):
		"""Handles WebSocket disconnection"""
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		if self.user_object in self.matchmaking_queue:
			self.matchmaking_queue.remove(self.user_object)
		print(f"Player disconnected: {self.user_id} | MMR: {self.user_mmr}")

	async def receive(self, text_data):
		"""Handles messages received from WebSocket clients"""
		request = json.loads(text_data)
		action = request.get("action")

		if action == "join_matchmaking":
			if any(obj['channel_name'] == self.channel_name for obj in self.matchmaking_queue):
				print(f"Player {self.user_id} is already in the matchmaking queue.")
				return

			self.matchmaking_queue.append(self.user_object)
			print(f"Player {self.user_id} joined matchmaking. Queue size: {len(self.matchmaking_queue)}")
			await self.check_for_match()
		elif action == "close_matchmaking":
			self.disconnect(0)

	async def check_for_match(self):
		"""Checks if there are enough players to create a match"""

		while len(self.matchmaking_queue) >= 2:
			elapsed_time = time.time() - self.join_time
			mmr_gap = self.base_mmr_gap

			if elapsed_time > 20:
				mmr_gap = min(self.base_mmr_gap + (elapsed_time // 20) * 20, self.max_mmr_gap)

			player1 = self.matchmaking_queue[0]
			player2 = self.matchmaking_queue[1]

			player1_mmr = player1['mmr']
			player2_mmr = player2['mmr']

			if abs(player1_mmr - player2_mmr) <= mmr_gap:
				room_name = str(uuid.uuid4())
				await self.channel_layer.send(
					player1['channel_name'],
					{
						"type": "send.match.found",
						"room_name": room_name,
					}
				)
				await self.channel_layer.send(
					player2['channel_name'],
					{
						"type": "send.match.found",
						"room_name": room_name,
					}
				)

				self.matchmaking_queue = self.matchmaking_queue[2:]

			else:
				self.matchmaking_queue.append(player1)
				self.matchmaking_queue.append(player2)
				self.matchmaking_queue = self.matchmaking_queue[2:]

			if elapsed_time > 60:
				room_name = str(uuid.uuid4())
				await self.channel_layer.send(
					player1['channel_name'],
					{
						"type": "send.match.found",
						"room_name": room_name,
					}
				)
				await self.channel_layer.send(
					player2['channel_name'],
					{
						"type": "send.match.found",
						"room_name": room_name,
					}
				)
				break

	async def send_match_found(self, event):
		"""Sends match found event to a player"""
		room_name = event["room_name"]
		await self.send(text_data=json.dumps({
			"type": "setup_pong_lobby",
			"room_name": room_name
		}))

class PongMultiplayerConsumer(BaseConsumer):
	async def connect(self):
		self.user_id = self.scope["user"].id
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]

		self.lobby: Lobby = match_manager.get_match(self.room_name)
		if self.lobby is None:
			self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(True), LOBBY_NAME)

		await self.join_group(self.lobby.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.lobby:
			await self.leave_group(self.lobby.room_group_name)

	async def handle_event(self, data: dict):
		if self.lobby:
			await self.lobby.manage_event(data, match_manager)

class PongSingleplayerConsumer(BaseConsumer):
	def generate_random_room_name(self) -> str:
		room_components = [str(v) for v in self.scope["url_route"]["kwargs"].values()]
		room_components.append(str(uuid.uuid4()))
		return "_".join(room_components)

	async def connect(self):
		self.room_name = self.generate_random_room_name()
		self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(False), LOBBY_NAME)

		await self.join_group(self.lobby.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.lobby:
			await self.leave_group(self.lobby.room_group_name)

	async def handle_event(self, data: dict):
		event_type = data.get("type")

		if event_type == "init_player":
			self.useBot = data.get("mode") == "vs_bot"
			
			await self.lobby.manage_event(data, match_manager)

			if self.useBot:
				await self.lobby.add_player_to_lobby({"player_id": "-1"}, True)
			else:
				await self.lobby.add_player_to_lobby({"player_id": "-1"}, False)
			
			await self.lobby.mark_player_ready({"player_id": "-1"})
		else:
			await self.lobby.manage_event(data, match_manager)

class PongLobbyConsumer(BaseConsumer):
	async def connect(self):
		self.user = self.scope["user"]
		self.user_id = self.user.id
		self.room_name = self.scope["url_route"]["kwargs"].get("room_name")

		if self.room_name is None:
			self.room_name = str(uuid.uuid4())
			await self.send_to_social({
				"type": "send_pong_lobby",
				"room_name": self.room_name,
			})

		self.lobby: Lobby = match_manager.get_match(self.room_name)
		if self.lobby is None:
			self.lobby: Lobby = match_manager.create_match("pong", self.room_name, PongGameManager(False), LOBBY_NAME)

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

		await self.lobby.manage_event(data, match_manager)

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
			self.tournament: Tournament = match_manager.create_match("pong", self.room_name, PongGameManager(False), TOURNAMENT_NAME)

		await self.join_group(self.tournament.room_group_name)
		await self.accept()

	async def disconnect(self, close_code):
		if self.tournament:
			await self.leave_group(self.tournament.room_group_name)

	async def handle_event(self, data: dict):
		event_type = data.get("type")
		if not event_type:
			print("Event type is missing in the received data.")
			return

		await self.tournament.manage_event(data, match_manager)

	async def lobby_state(self, event: dict):
		event_type = event.get("event_name")
		if event_type == "player_join":
			await self.send_to_social({
				"type": "user_join_tournament",
				"players": event.get("players")
			})
		else:
			await self.safe_send({
				"event_info": event,
				"lobby_info": event.get("tournament_snapshot") or self.tournament.to_dict(),
			})