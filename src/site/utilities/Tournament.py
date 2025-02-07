import asyncio
from enum import Enum
from utilities.GameManager import GameManager
from channels.layers import get_channel_layer

class Tournament():

	class TournamentStatus(Enum):
		"""Defines the possible states of a lobby."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		WAITING_PLAYER_RECONNECTION = "waiting_player_reconnection"
		
	def __init__(self, game_name: str, room_name: str, game_manager: GameManager):
		self.room_group_name = f"{game_name}_tournament_{room_name}"
		self.tournament_status = self.TournamentStatus.TO_SETUP
		self.update_lock = asyncio.Lock()
		self.game_manager = game_manager
		self.tournament_player = 4
		self.score_to_win = 5
		self.players = []

	def tournament_settings(self, tournament_player: int = 4, score_to_win: int = 5):
		self.tournament_player = tournament_player
		self.score_to_win = score_to_win

	async def start_tournament(self):

		data_to_send = {
			"type": "lobby_state",
			"event_name": "tournament start",
		}

		self.game_manager.add_player(self.players[0], False)
		self.game_manager.add_player(self.players[1], False)
		del self.players[:2]

		self.lobby_status = self.TournamentStatus.PLAYING
		self.game_loop_task = asyncio.create_task(self.game_loop())
		data_to_send = {
			"type": "lobby_state",
			"event_name": "game_started",
		}
		await self.broadcast_message(data_to_send)

	async def game_loop(self):
		"""
		Runs the core game loop for the lobby. The game loop runs at a fixed frame rate while the lobby is full.

		This method is responsible for updating the game state and broadcasting it to all players.
		"""
		try:
			while True:
				async with self.update_lock:
					await self.game_manager.game_loop()
					await asyncio.sleep(1 / 60)
					await self.broadcast_message({
						"type": "lobby_state",
						"event": "game_loop"
						})
		except asyncio.CancelledError:
			print("Game loop task was cancelled.")

	async def broadcast_message(self, message: dict):
		channel_layer = get_channel_layer()
		await channel_layer.group_send(self.room_group_name, message)
	
	async def manage_event(self, data: dict):
		event_type = data.get("type")
		if not event_type:
			print("Event type is missing in the received data.")
			return
		
		match event_type:
			case "init_player":
				self.add_player_to_tournament(data, False)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	async def add_player_to_tournament(self, data: dict, is_bot: bool):
		if not data.get("player_id"):
			raise ValueError("Invalid data: 'player_id' is required.")
		
		player_id = int(data.get("player_id"))
		
		if len(self.players) > 1:

			data_to_send = {
				"type": "lobby_state",
				"event_name": "recover_player_data",
			}

			await self.broadcast_message(data_to_send)
		
		self.players.append(player_id)

		data_to_send = {
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": player_id
		}

		await self.broadcast_message(data_to_send)

		if len(self.players) == self.tournament_player:
			self.start_tournament()

	def to_dict(self) -> dict:
		tournament_data =  {"current_tournament_status": self.tournament_status.name}
		tournament_data.update(self.game_manager.to_dict())

		return tournament_data