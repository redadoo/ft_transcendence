import asyncio
from enum import Enum
from channels.layers import get_channel_layer
from utilities.GameManager import GameManager

class Lobby:

	class LobbyStatus(Enum):
		"""Defines the possible states of a lobby."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		WAITING_PLAYER_RECONNECTION = "waiting_player_reconnection"

	def __init__(self, room_name: str, game_manager: GameManager) -> None:
		self.room_group_name = f"pong_multiplayer_{room_name}"
		self.players_id = []
		self.game_manager = game_manager
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.update_lock = asyncio.Lock()

	async def broadcast_message(self, message: dict):
		channel_layer = get_channel_layer()
		if not channel_layer:
			print("Channel layer is unavailable.")
			return
		await channel_layer.group_send(self.room_group_name, message)

	async def manage_event(self, data: dict):
		"""
		Handles incoming events for the lobby.
		"""

		event_type = data.get("type")
		if not event_type:
			print("Event type is missing in the received data.")
			return
		
		match event_type:
			case "init_player":
				await self.add_player(data)
			case "update_player":
				self.game_manager.update_player(data)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")


	async def add_player(self, data: dict):
		"""
		Adds a player to the lobby. Broadcasts the lobby state when players are added.
		"""
		player_id = data.get("player_id")
		if not player_id:
			raise ValueError("Invalid data: 'player_id' is required.")
		
		if player_id in self.players_id:
			print(f"Player {player_id} already exists in the lobby.")
			return
		
		self.players_id.append(player_id)
		if len(self.players_id) == self.game_manager.max_players:
			self.lobby_status = Lobby.LobbyStatus.PLAYING
			self.game_manager.init_player(self.players_id)
			self.game_loop_task = asyncio.create_task(self.game_loop())

		await self.broadcast_message({"type": "lobby_state"})
	
	async def game_loop(self):
		"""
		Main game loop for the lobby. Runs at a fixed frame rate.
		"""
		try:
			while self.is_full():
				async with self.update_lock:
					await self.game_manager.game_loop()
					await asyncio.sleep(1 / 60)  # 60 FPS
					await self.broadcast_message({"type": "lobby_state"})
		except asyncio.CancelledError:
			print("Game loop task was cancelled.")

	def remove_player(self, player_id: int):
		"""
		Handles the removal of a player from the lobby.
		"""
		self.lobby_status = Lobby.LobbyStatus.WAITING_PLAYER_RECONNECTION
		self.game_manager.player_disconnected(player_id)

	def is_full(self) -> bool:
		"""
		Checks whether the lobby has reached the maximum player count.
		"""
		return len(self.players_id) == self.game_manager.max_players

	def to_dict(self) -> dict:
		"""
		Converts the lobby to a dictionary.
		"""

		lobby_data =  {"current_lobby_status": self.lobby_status.name}
		lobby_data.update(self.game_manager.to_dict())

		return lobby_data