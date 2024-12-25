import asyncio
from enum import Enum
from channels.layers import get_channel_layer
from utilities.GameManager import GameManager

class Lobby:
	"""
	A class representing a multiplayer lobby for managing the game state, players, and events.
	"""

	class LobbyStatus(Enum):
		"""Defines the possible states of a lobby."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		WAITING_PLAYER_RECONNECTION = "waiting_player_reconnection"

	def __init__(self, room_name: str, game_manager: GameManager):
		"""
        Initializes a new lobby with the specified room name and game manager.

        Args:
            room_name (str): The name of the room (used for group communication).
            game_manager (GameManager): The game manager responsible for managing the game state and players.
        """
		self.room_group_name = f"pong_multiplayer_{room_name}"
		self.game_manager = game_manager
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.update_lock = asyncio.Lock()

	async def broadcast_message(self, message: dict):
		"""
        Broadcasts a message to all clients in the lobby.

        Args:
            message (dict): The message to send, typically containing event type and data.
        """
		channel_layer = get_channel_layer()
		if not channel_layer:
			print("Channel layer is unavailable.")
			return
		await channel_layer.group_send(self.room_group_name, message)

	async def manage_event(self, data: dict):
		"""
		Handles incoming events for the lobby, such as player actions or game state updates.

		Args:
			data (dict): The event data, containing an event type and relevant information.
		"""
		event_type = data.get("type")
		if not event_type:
			print("Event type is missing in the received data.")
			return
		
		match event_type:
			case "init_player":
				await self.add_player(data, False)
			case "update_player":
				self.game_manager.update_player(data)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	async def add_player(self, data: dict, is_bot: bool):
		"""
		Adds a player to the lobby. If the lobby is full, starts the game loop.

		Args:
			data (dict): The player data, including the player ID.
			is_bot (bool): Whether the player is a bot.
		
		Raises:
			ValueError: If the player data is missing a player ID.
		"""
		player_id = data.get("player_id")
		if not player_id:
			raise ValueError("Invalid data: 'player_id' is required.")
		
		self.game_manager.add_player(player_id, is_bot)

		if len(self.game_manager.players) == self.game_manager.max_players:
			self.lobby_status = Lobby.LobbyStatus.PLAYING
			self.game_loop_task = asyncio.create_task(self.game_loop())

		await self.broadcast_message({"type": "lobby_state"})
	
	async def game_loop(self):
		"""
		Runs the core game loop for the lobby. The game loop runs at a fixed frame rate while the lobby is full.

		This method is responsible for updating the game state and broadcasting it to all players.
		"""
		try:
			while self.is_full():
				async with self.update_lock:
					await self.game_manager.game_loop()
					await asyncio.sleep(1 / 60)
					await self.broadcast_message({"type": "lobby_state"})
		except asyncio.CancelledError:
			print("Game loop task was cancelled.")

	def remove_player(self, player_id: int):
		"""
		Removes a player from the lobby and handles player disconnection logic.

		Args:
			player_id (int): The ID of the player to remove.
		"""
		self.lobby_status = Lobby.LobbyStatus.WAITING_PLAYER_RECONNECTION
		self.game_manager.player_disconnected(player_id)

	def is_full(self) -> bool:
		"""
		Checks whether the lobby has reached the maximum number of players.

		Returns:
			bool: True if the lobby is full, otherwise False.
		"""
		return len(self.game_manager.players) == self.game_manager.max_players

	def to_dict(self) -> dict:
		"""
		Converts the lobby's state into a dictionary format, including the game manager's state.

		Returns:
			dict: A dictionary representing the lobby's state.
		"""
		lobby_data =  {"current_lobby_status": self.lobby_status.name}
		lobby_data.update(self.game_manager.to_dict())

		return lobby_data