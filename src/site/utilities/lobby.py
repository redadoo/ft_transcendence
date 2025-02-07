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

	def __init__(self, game_name: str, room_name: str, game_manager: GameManager):
		"""
		Initializes a new lobby with the specified room name and game manager.

		Args:
			room_name (str): The name of the room (used for group communication).
			game_manager (GameManager): The game manager responsible for managing the game state and players.
		"""
		self.room_group_name = f"{game_name}_lobby_{room_name}"
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.update_lock = asyncio.Lock()
		self.game_manager = game_manager
		self.client_ready = 0

	async def broadcast_message(self, message: dict):
		"""
		Broadcasts a message to all clients in the lobby.

		Args:
			message (dict): The message to send, typically containing event type and data.
		"""
		channel_layer = get_channel_layer()
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
				await self.add_player_to_lobby(data, False)
			case "lobby setuped":
				await self.start_game()
			case "update_player":
				self.game_manager.update_player(data)
			case "quit_game":
				pass
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	async def start_game(self):
		self.client_ready += 1

		if self.client_ready == self.game_manager.max_players:
			self.lobby_status = Lobby.LobbyStatus.PLAYING
			self.game_manager.start_game()
			self.game_loop_task = asyncio.create_task(self.game_loop())
			data_to_send = {
				"type": "lobby_state",
				"event_name": "game_started",
			}
			await self.broadcast_message(data_to_send)

	async def add_player_to_lobby(self, data: dict, is_bot: bool):
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
		
		#if a player enters the lobby he needs the data of the players already present
		if len(self.game_manager.players) > 1:
			data_to_send = {
				"type": "lobby_state",
				"event_name": "recover_player_data",
			}

			await self.broadcast_message(data_to_send)

		data_to_send = {
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": player_id
		}

		await self.broadcast_message(data_to_send)

	async def game_loop(self):
		"""
		Runs the core game loop for the lobby. The game loop runs at a fixed frame rate while the lobby is full.

		This method is responsible for updating the game state and broadcasting it to all players.
		"""
		try:
			while self.game_manager.game_loop_is_active:
				async with self.update_lock:
					await self.game_manager.game_loop()
					await asyncio.sleep(1 / 60)
					await self.broadcast_message({
						"type": "lobby_state",
						"event": "game_loop"
						})
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

	def to_dict(self) -> dict:
		"""
		Converts the lobby's state into a dictionary format, including the game manager's state.

		Returns:
			dict: A dictionary representing the lobby's state.
		"""
		lobby_data =  {"current_lobby_status": self.lobby_status.name}
		lobby_data.update(self.game_manager.to_dict())

		return lobby_data