import asyncio
from enum import Enum
from utilities.GameManager import GameManager
from channels.layers import get_channel_layer

PLAYER_NUMBER = 4
MATCH_PLAYER_NUMBER = 2
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
		self.game_manager: GameManager = game_manager
		self.channel_layer = get_channel_layer()
		self.update_lock = asyncio.Lock()
		self.tournament_player = PLAYER_NUMBER
		self.score_to_win = SCORE_TO_WIN
		self.bracket_match: list = []
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
				await self.add_player_to_tournament(data)
			case "host_start_tournament":
				await self.tournament_start()
			case "update_player":
				self.game_manager.update_player(data)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	def setup_tournamet(self):

		number_of_first_bracket_match = int(len(self.players) / MATCH_PLAYER_NUMBER)

		i = 0
		while i <= number_of_first_bracket_match:
			self.bracket_match.append([self.players[i],self.players[i + 1]])
			i += MATCH_PLAYER_NUMBER

	async def setup_match(self):

		if len(self.bracket_match) == 0:
			print("impossible to start a match")
			return
		
		match = self.bracket_match.pop(0)
		self.game_manager.add_player(match[0], False)
		self.game_manager.add_player(match[1], False)		

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_to_setup",
			"players": self.game_manager.players_to_dict()
		})

	async def tournament_start(self):
		self.tournament_status = self.TournamentStatus.PLAYING
		self.game_manager.start_game()
		self.game_loop_task = asyncio.create_task(self.game_loop())

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "match_start",
		})

	async def add_player_to_tournament(self, data: dict):
		if not data.get("player_id"):
			raise ValueError("Invalid data: 'player_id' is required.")

		player_id = int(data.get("player_id"))
		self.players.append(player_id)

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": player_id,
		})

		if len(self.players) == PLAYER_NUMBER:
			self.setup_tournamet()
			await self.setup_match()

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
			self.players.remove(loser_id)
			self.tournament_status = self.TournamentStatus.ENDED
			await self.broadcast_message({
				"type": "lobby_state",
				"event": "match_finished"
			})

	def to_dict(self) -> dict:
		tournament_data =  {"current_tournament_status": self.tournament_status.name}
		tournament_player = {"tournament_players": self.players}
		tournament_data.update(tournament_player)
		tournament_data.update(self.game_manager.to_dict())
		return tournament_data