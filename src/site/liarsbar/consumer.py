import json
import uuid

from utilities.lobby import Lobby
from utilities.MatchManager import MatchManager
from ft_transcendence.consumer import BaseConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from .scripts.LiarsBarGameManager import LiarsBarGameManager

LOBBY_NAME = "lobby"
match_manager = MatchManager()

class LiarsBarMatchmaking(AsyncWebsocketConsumer):
	matchmaking_queue = set()
	room_group_name = "liarsbar_matchmaking"

	async def connect(self):
		"""Handles WebSocket connection"""
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()
		print(f"Player connected: {self.channel_name}")

	async def disconnect(self, close_code):
		"""Handles WebSocket disconnection"""
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		self.matchmaking_queue.discard(self.channel_name)

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
		while len(self.matchmaking_queue) >= 4:
			players = [self.matchmaking_queue.pop() for _ in range(4)]
			room_name = f"liarsbar_{uuid.uuid4()}"

			for player in players:
				await self.channel_layer.send(
					player,
					{
						"type": "send.match.found",
						"room_name": room_name,
					}
				)

	async def send_match_found(self, event):
		"""Sends match found event to a player"""
		room_name = event["room_name"]
		await self.send(text_data=json.dumps({
			"type": "setup_liarsbar_lobby",
			"room_name": room_name
		}))

class LiarsBarConsumer(BaseConsumer):
	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
	
		self.lobby: Lobby = match_manager.get_match(self.room_name, LOBBY_NAME) 
		if self.lobby == None:
			self.lobby = match_manager.create_match("liarsbar", self.room_name,  LiarsBarGameManager(), LOBBY_NAME)

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.lobby.broadcast_message({"type": "lobby_state"})
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def handle_event(self, data: dict):
		if self.lobby:
			await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		lobby_info = event.get("lobby_snapshot") or self.lobby.to_dict()

		data_to_send = {
			"event_info": event,
			"lobby_info": lobby_info
		}

		await self.safe_send(data_to_send)

		if event.get("event_name") == "player_join":
			await self.lobby.mark_player_ready({"player_id": event.get("player_id")})