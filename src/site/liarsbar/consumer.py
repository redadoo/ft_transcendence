import asyncio
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from utilities.lobbies import Lobbies
from .scripts.LiarsBarGameManager import LiarsBarGameManager

lobbies = Lobbies()

class  liarsBarConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
	
		self.lobby = lobbies._get_lobby(self.room_name) 
		if self.lobby == None:
			self.lobby = lobbies._create_lobby(self.room_name,  LiarsBarGameManager())

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