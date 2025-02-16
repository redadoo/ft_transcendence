import json
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer
from utilities.MatchManager import MatchManager
from .scripts.LiarsBarGameManager import LiarsBarGameManager

match_manager = MatchManager()

class LiarsBarMatchmaking(AsyncWebsocketConsumer):
	matchmaking_queue = []
	room_group_name = "liarsbar_matchmaking"

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
		while len(self.matchmaking_queue) >= 4:
			players = [self.matchmaking_queue.pop(0) for _ in range(4)]
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
		await self.send(text_data=json.dumps({
			"type": "setup_pong_lobby",
			"room_name": event["room_name"],
		}))

class LiarsBarConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
	
		self.lobby = match_manager.get_match(self.room_name) 
		if self.lobby == None:
			self.lobby = match_manager.create_match("liarsbar", self.room_name,  LiarsBarGameManager(), "Lobby")

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()

		await self.lobby.add_player_to_lobby({"player_id": "123"}, True)
		await self.lobby.add_player_to_lobby({"player_id": "124"}, True)
		await self.lobby.add_player_to_lobby({"player_id": "125"}, True)
		await self.lobby.start_game()
		await self.lobby.start_game()
		await self.lobby.start_game()


	async def disconnect(self, close_code):
		await self.lobby.broadcast_message({"type": "lobby_state"})
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		data_to_send = {
			"event_info": event,
			"lobby_info": self.lobby.to_dict()
		}
		await self.send(text_data=json.dumps(data_to_send))