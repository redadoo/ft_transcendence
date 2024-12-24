import json
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer
from pong.scritps.PongGameManager import PongGameManager
from utilities.lobbies import Lobbies
from utilities.lobby import Lobby

lobbies = Lobbies()

class PongMatchmaking(AsyncWebsocketConsumer):
	matchmaking_queue = []
	room_group_name = "pong_matchmaking"
	
	async def connect(self):
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		if self.channel_name in self.matchmaking_queue:
			self.matchmaking_queue.remove(self.channel_name)

	async def receive(self, text_data):
		request = json.loads(text_data)
		if request.get("action") == "join_matchmaking":
			self.matchmaking_queue.append(self.channel_name)
			await self.check_for_match()

	async def check_for_match(self):
		while len(self.matchmaking_queue) >= 2:
			player1 = self.matchmaking_queue.pop(0)
			player2 = self.matchmaking_queue.pop(0)

			room_name = str(uuid.uuid4())

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
		room_name = event["room_name"]
		await self.send(text_data=json.dumps({
			"type": "setup_pong_lobby", 
			"room_name": room_name
			}))

class PongMultiplayerConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
	
		self.lobby = lobbies.get_lobby(self.room_name) 
		if self.lobby == None:
			self.lobby = lobbies.create_lobby(self.room_name,  PongGameManager())

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.lobby.broadcast_message({"type": "lobby_state"})
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		await self.send(
			text_data=json.dumps({
				"type": event["type"],
				"lobby": self.lobby.to_dict()
			})
		)

class PongSingleplayerConsumer(AsyncWebsocketConsumer):

	def generate_random_room_name(self) -> str:
		room_name_dict = self.scope["url_route"]["kwargs"]
		room_name_components = [str(value) for value in room_name_dict.values()]
		room_name_components.append(str(uuid.uuid4()))
		return "_".join(room_name_components)

	async def connect(self):
		self.room_name = self.generate_random_room_name()
		self.lobby: Lobby = lobbies.create_lobby(self.room_name,  PongGameManager())

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()
		await self.lobby.add_player({"player_id" : str(uuid.uuid4())}, True)

	async def disconnect(self, close_code):
		await self.lobby.broadcast_message({"type": "lobby_state"})
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		await self.send(
			text_data=json.dumps({
				"type": event["type"],
				"lobby": self.lobby.to_dict()
			})
		)