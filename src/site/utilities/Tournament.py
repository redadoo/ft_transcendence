import asyncio
from enum import Enum
from utilities.GameManager import GameManager
from channels.layers import get_channel_layer
from pong.models import PongTournament
from channels.db import database_sync_to_async

PLAYER_NUMBER = 4
MATCH_PLAYER_NUMBER = 2

class Tournament():
	class TournamentStatus(Enum):
		"""Defines the possible states of a tournament."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		PLAYER_DISCONNECTED = "PLAYER_DISCONNECTED"

	def __init__(self, game_name: str, room_name: str, game_manager: GameManager, matchManager):
		self.room_group_name = f"{game_name}_tournament_{room_name}"
		self.tournament_status = self.TournamentStatus.TO_SETUP
		self.game_manager: GameManager = game_manager
		self.channel_layer = get_channel_layer()
		self.tournament_player = PLAYER_NUMBER
		self.update_lock = asyncio.Lock()

		self.players: list = []
		self.all_players: list = []
		self.bracket: list = []
		self.current_round_winners: list = []  
		self.current_round_index: int = 0 
		self.game_loop_task = None
		self.matchManager = matchManager

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
			case "waiting_next_match":
				await self.tournament_start()
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	def setup_first_round(self):
		"""Builds the first round from the joined players."""
		if len(self.players) < MATCH_PLAYER_NUMBER:
			print("Not enough players to start a tournament.")
			return
		matches = []
		players_queue = self.players[:]  # Work on a copy
		while len(players_queue) >= MATCH_PLAYER_NUMBER:
			match = [players_queue.pop(0), players_queue.pop(0)]
			matches.append(match)
		# The bracket is a list of rounds; here, round 0:
		self.bracket = [matches]
		self.current_round_winners = []
		self.current_round_index = 0

	async def setup_next_round(self, winners: list):
		"""Creates the next round from the winners of the previous round.
		   If there's an odd number of winners, the last one gets a bye."""
		if len(winners) < MATCH_PLAYER_NUMBER:
			snapshot = self.to_dict()
			await self.broadcast_message({
				"type": "lobby_state",
				"event": "tournament_finished",
				"winner_id": self.current_round_winners[0],
				"tournament_snapshot": snapshot,
			})
			return

		next_round_matches = []
		winners_queue = winners[:]  # Copy the list

		while len(winners_queue) >= MATCH_PLAYER_NUMBER:
			match = [winners_queue.pop(0), winners_queue.pop(0)]
			next_round_matches.append(match)

		# Reset the winners for the new round; if there was a bye, that player automatically advances.
		self.current_round_winners = []

		if next_round_matches:
			self.bracket.append(next_round_matches)
		self.current_round_index += 1

	async def setup_pong_manager(self):
		"""Prepares the next match from the current round in the bracket."""
		# Ensure there is a current round.
		if not self.bracket or self.current_round_index >= len(self.bracket):
			print("No more matches available in the bracket.")
			return

		current_round_matches = self.bracket[self.current_round_index]

		if not current_round_matches:
			if self.current_round_winners:
				await self.setup_next_round(self.current_round_winners)
				if len(self.current_round_winners) == 1:
					snapshot = self.to_dict()
					await self.broadcast_message({
						"type": "lobby_state",
						"event": "tournament_finished",
						"winner_id": self.current_round_winners[0],
						"tournament_snapshot": snapshot,
					})
					print("dove")
					return
				current_round_matches = self.bracket[self.current_round_index]
			else:
				print("No winners to set up next round.")
				return

		# Start the next match in the current round.
		match = current_round_matches.pop(0)
		self.game_manager.reset()
		self.game_loop_task = None
		self.game_manager.add_player(match[0], False)
		self.game_manager.add_player(match[1], False)
		self.tournament_status = self.TournamentStatus.TO_SETUP

		snapshot = self.to_dict()
		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_to_setup",
			"players": self.game_manager.players_to_dict(),
			"tournament_snapshot": snapshot,
		})

	async def tournament_start(self):
		"""Starts the tournament by kicking off the game loop and the first match."""
		if not self.bracket:
			print("Tournament not set up properly.")
			return
		await self.setup_pong_manager()

		self.game_manager.start_game()
		self.tournament_status = self.TournamentStatus.PLAYING
		self.game_loop_task = asyncio.create_task(self.game_loop())
		
		snapshot = self.to_dict()
		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "match_start",
			"tournament_snapshot": snapshot,
		})

	async def add_player_to_tournament(self, data: dict):
		if not data.get("player_id"):
			raise ValueError("Invalid data: 'player_id' is required.")

		player_id = int(data.get("player_id"))
		self.players.append(player_id)
		self.all_players.append(player_id)
		snapshot = self.to_dict()
		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_join",
			"player_id": player_id,
			"tournament_snapshot": snapshot,
		})

		if len(self.players) == PLAYER_NUMBER:
			self.setup_first_round()

	async def game_loop(self):
		"""
		Runs the core game loop for the current match.
		After the match concludes, records the winner and moves on.
		"""
		try:
			while self.game_manager.game_loop_is_active:
				async with self.update_lock:
					await self.game_manager.game_loop()
				await asyncio.sleep(1 / 60)
				snapshot = self.to_dict()
				await self.broadcast_message({
					"type": "lobby_state",
					"event": "game_loop",
					"tournament_snapshot": snapshot,
				})
		except asyncio.CancelledError:
			print("Game loop task was cancelled.")
		finally:
			loser_id = self.game_manager.get_loser()
			winner_id = self.game_manager.get_winner()

			# Remove the loser from the overall player list.
			if loser_id in self.players:
				self.players.remove(loser_id)

			# Record the winner for the current round.
			self.current_round_winners.append(winner_id)

			self.tournament_status = self.TournamentStatus.ENDED
			snapshot = self.to_dict()
			if len(self.players) == 1:
				print("tournament_finished")
				await self.broadcast_message({
					"type": "lobby_state",
					"event": "tournament_finished",
					"winner_id": self.current_round_winners[0],
					"tournament_snapshot": snapshot,
				})
				tournament: PongTournament = await database_sync_to_async(PongTournament.objects.create)()
				await tournament.add_players_to_tournament(self.all_players)
				await tournament.set_winner(self.current_round_winners[0])
			else:
				print(f"game finish {self.players}")
				await self.broadcast_message({
					"type": "lobby_state",
					"event": "match_finished",
					"loser_id": loser_id,
					"tournament_snapshot": snapshot,
				})

	def to_dict(self) -> dict:
		tournament_data = {"current_tournament_status": self.tournament_status.name}
		tournament_data.update({"tournament_players": self.players})
		tournament_data.update(self.game_manager.to_dict())
		return tournament_data
