import asyncio
from enum import Enum
from channels.layers import get_channel_layer
from utilities.GameManager import GameManager

class Lobby:

	class LobbyStatus(Enum):
		TO_SETUP = 0
		PLAYING = 1
		ENDED = 2
		WAITING_PLAYER_RECONNECTION = 3

	def __init__(self, room_name: str, game_manager: GameManager) -> None:
		self.room_group_name = f"pong_multiplayer_{room_name}"
		self.players_id = []
		self.game_manager = game_manager
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.update_lock = asyncio.Lock()

	async def manage_event(self, data: dict):
		event_type = data.get("type")
		match event_type:
			case "init_player":
				await self.add_player(data)
			case "update_player":
				self.game_manager.update_player(data)
			case _:
				print(f"Unhandled event type: {event_type}")

	async def broadcast_lobby(self, type: str):
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_group_name,{"type": type})

	async def add_player(self, data: dict):
		player_id = data.get("player_id") 

		if player_id == None:
			raise ValueError(f"bad dict cant retrieve player_id")
		
		if player_id not in self.players_id:
			self.players_id.append(player_id)
			if len(self.players_id) == self.game_manager.max_players:
				self.lobby_status = Lobby.LobbyStatus.PLAYING
				self.game_manager.init_player(self.players_id)
				self.game_loop_task = asyncio.create_task(self.game_loop())

			await self.broadcast_lobby("lobby_state")
		else:
			print(f"Player {player_id} already exists in lobby.")

	def remove_player(self, player_id: int):
		self.lobby_status = Lobby.LobbyStatus.WAITING_PLAYER_RECONNECTION
		self.game_manager.player_disconnected(player_id)

	def is_full(self):
		return len(self.players_id) == self.game_manager.max_players

	async def game_loop(self):
		while self.is_full() == True:
			async with self.update_lock:
				await self.game_manager.game_loop()
				await asyncio.sleep(1 / 60)
				await self.broadcast_lobby("lobby_state")

	def to_dict(self):
		"""
		Converts the lobby to a dictionary.
		"""

		lobby_data =  {"current_lobby_status": self.lobby_status.name}
		lobby_data.update(self.game_manager.to_dict())

		return lobby_data