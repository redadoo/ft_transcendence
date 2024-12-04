import asyncio
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from utilities.lobbies import Lobbies
from .scripts.LiarsBarGameManager import LiarsBarGameManager

class  liarsBarConsumer(AsyncWebsocketConsumer):
	lobbies = Lobbies()

	async def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = f"liarsbar_multiplayer_{self.room_name}"

		self.lobby = self.lobbies._create_lobby(self.room_name,  LiarsBarGameManager())

		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()
		await self.send(text_data=json.dumps(self.lobby.to_dict()))

		self.update_lock = asyncio.Lock()

	async def disconnect(self, close_code):
		await self.close()
