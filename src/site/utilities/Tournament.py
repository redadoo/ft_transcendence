import asyncio
from enum import Enum
from utilities.GameManager import GameManager
from channels.layers import get_channel_layer

MIN_PLAYER_NUMBER = 8
SCORE_TO_WIN = 1

class Tournament():

	class TournamentStatus(Enum):
		"""Defines the possible states of a lobby."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		PLAYER_DISCONNECTED = "PLAYER_DISCONNECTED"
		
	def __init__(self, game_name: str, room_name: str, game_manager: GameManager):
		self.room_group_name = f"{game_name}_tournament_{room_name}"
		self.tournament_status = self.TournamentStatus.TO_SETUP
		self.channel_layer = get_channel_layer()
		self.update_lock = asyncio.Lock()
		self.game_manager = game_manager
		self.tournament_player = MIN_PLAYER_NUMBER
		self.score_to_win = SCORE_TO_WIN
		self.players: list = [] 

	async def broadcast_message(self, message: dict):
		await self.channel_layer.group_send(self.room_group_name, message)
	
	async def manage_event(self, data: dict):
		event_type = data.get("type")
		if not event_type:
			print("Event type is missing in the received data.")
			return

		match event_type:
			case "init_player":
				await self.add_player_to_tournament(data, False)
			case "client_ready":
				await self.tournament_start()
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	async def tournament_start(self):
		
		players_list = list(self.players)

		self.game_manager.add_player(players_list[0], False)
		self.game_manager.add_player(players_list[1], False)

		self.tournament_status = self.TournamentStatus.PLAYING
		self.game_loop_task = asyncio.create_task(self.game_loop())

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "host_started_game",
		})

	async def setup_next_match(self):
		pass

	async def add_player_to_tournament(self, data: dict, is_bot: bool):
		if not data.get("player_id"):
			raise ValueError("Invalid data: 'player_id' is required.")
		
		player_id = int(data.get("player_id"))

		if len(self.players) > 1:
			await self.broadcast_message({
				"type": "lobby_state",
				"event_name": "recover_player_data",
			})
		
		self.players.append(player_id)

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": player_id,
		})

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
		finally:

			loser_id = self.game_manager.get_loser()
			self.players.pop(loser_id)

			await self.broadcast_message({
				"type": "lobby_state",
				"event": "match_finished"
			})

	def to_dict(self) -> dict:
		tournament_data =  {"current_tournament_status": self.tournament_status.name}
		tournament_data.update(self.game_manager.to_dict())

		return tournament_data