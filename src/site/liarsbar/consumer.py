import asyncio
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from utilities.lobbies import Lobbies


class  liarsBarConsumer(AsyncWebsocketConsumer):
    lobbies = Lobbies()

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"liarsbar_multiplayer_{self.room_name}"

        self.lobby = self.lobbies.create_lobby(self.room_name, {"players": {}})

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        self.update_lock = asyncio.Lock()

        await self.send(
            text_data=json.dumps(
                {
                }
            )
        )
        pass


    async def disconnect(self, close_code):
        print("disconnect")
        pass
