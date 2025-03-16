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
		PLAYER_DISCONNECTED = "PLAYER_DISCONNECTED"

	def __init__(self, game_name: str, room_name: str, game_manager: GameManager):
		"""
		Initializes a new lobby with the specified room name and game manager.

		Args:
			game_name (str): The name of the game.
			room_name (str): The name of the room (used for group communication).
			game_manager (GameManager): The game manager responsible for managing the game state and players.
		"""
		self.room_group_name = f"{game_name}_lobby_{room_name}"
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.channel_layer = get_channel_layer()
		self.update_lock = asyncio.Lock()
		self.game_manager = game_manager
		self.ready_players = set()
		self.room_name = room_name
		self.game_loop_task = None

	async def broadcast_message(self, message: dict):
		"""
		Broadcasts a message to all clients in the lobby.

		Args:
			message (dict): The message to send, typically containing event type and data.
		"""
		if self.channel_layer:
			await self.channel_layer.group_send(self.room_group_name, message)

	async def manage_event(self, data: dict,  match_manager):
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
				await self.add_player_to_lobby(data, is_bot=False)
			case "client_ready":
				await self.mark_player_ready(data)
			case "update_player":
				self.game_manager.update_player(data)
			case "unexpected_quit":
				await self.close_lobby(data)
			case "quit_game":
				await self.close_lobby(data)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")
	
	async def force_player_ready(self):
		self.ready_players.add(list(self.game_manager.players)[1])
		data_to_send = {
			"type": "lobby_state",
			"event_name": "host_started_game",
		}
		await self.broadcast_message(data_to_send)

	async def mark_player_ready(self, data: dict):
		"""
		Marks the specified player as ready and starts the game if all players are ready.

		Args:
			player_id (int): The ID of the player to mark as ready.
		"""
		player_id = data.get("player_id")
		if player_id is not None:
			self.ready_players.add(player_id)
			if len(self.ready_players) >= self.game_manager.max_players:
				await self.start_game()

	async def start_game(self):
		"""
		Transitions the lobby into the PLAYING state, starts the game manager, and initiates the game loop.
		Also broadcasts a 'game_started' event to all players.
		"""
		if self.game_loop_task != None:
			return
		
		self.lobby_status = Lobby.LobbyStatus.PLAYING
		self.game_manager.start_game()
		self.game_loop_task = asyncio.create_task(self.game_loop())
		data_to_send = {
			"type": "lobby_state",
			"event_name": "game_started",
		}
		await self.broadcast_message(data_to_send)

	def len_player(self)-> int:
		return len(self.game_manager.players)

	async def add_player_to_lobby(self, data: dict, is_bot: bool):
		"""
		Adds a player to the lobby. If there are already players in the lobby, 
		sends a message to recover the data of the already connected players.

		Args:
			data (dict): The player data, which must include the player ID.
			is_bot (bool): Indicates whether the joining player is a bot.
		
		Raises:
			ValueError: If the player data is missing a player ID.
		"""
		player_id = data.get("player_id")
		if not player_id:
			raise ValueError("Invalid data: 'player_id' is required.")

		self.game_manager.add_player(player_id, is_bot)

		# If more than one player is present, instruct the new player to recover existing players' data
		if len(self.game_manager.players) > 1:
			data_to_send = {
				"type": "lobby_state",
				"event_name": "recover_player_data",
			}
			await self.broadcast_message(data_to_send)

		data_to_send = {
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": int(player_id)
		}
		await self.broadcast_message(data_to_send)

	async def game_loop(self):
		"""
		Runs the core game loop for the lobby. This loop updates the game state at a fixed frame rate,
		broadcasts updates to all players, and terminates when the game is no longer active.
		"""
		try:
			# Main game loop
			while self.game_manager.game_loop_is_active:
				async with self.update_lock:
					await self.game_manager.game_loop()
				await asyncio.sleep(1 / 60)
				snapshot = self.to_dict()
				await self.broadcast_message({
					"type": "lobby_state",
					"event": "game_loop",
					"lobby_snapshot": snapshot,
				})
		except asyncio.CancelledError:
			print("Game loop task was cancelled.")
		finally:
			self.lobby_status = self.LobbyStatus.ENDED
			snapshot = self.to_dict()
			await self.broadcast_message({
				"type": "lobby_state",
				"event": "game_finished",
				"lobby_snapshot": snapshot,
			})

	async def close_lobby(self, data: dict):
		player_disconnected_id = data.get("player_id")
		player_disconnected_id = int(player_disconnected_id)

		if self.lobby_status == self.LobbyStatus.PLAYING:
			await self.game_manager.clear_and_save(False, player_disconnected_id)

	def to_dict(self) -> dict:
		"""
		Converts the current state of the lobby into a dictionary, including the game manager's state.

		Returns:
			dict: A dictionary representing the lobby's state.
		"""
		lobby_data = {"current_lobby_status": self.lobby_status.name}
		lobby_data.update(self.game_manager.to_dict())
		return lobby_data