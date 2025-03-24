import asyncio
from enum import Enum
from utilities.GameManager import GameManager
from channels.layers import get_channel_layer
from pong.models import PongTournament
from channels.db import database_sync_to_async

from website.models import User
from channels.db import database_sync_to_async
from website.serializers import SimpleUserProfileSerializer

PLAYER_NUMBER = 4
MATCH_PLAYER_NUMBER = 2

class Tournament():
	class TournamentStatus(Enum):
		"""Defines the possible states of a tournament."""
		TO_SETUP = "to_setup"
		PLAYING = "playing"
		ENDED = "ended"
		PLAYER_DISCONNECTED = "PLAYER_DISCONNECTED"

	def __init__(self, game_name: str, room_name: str, game_manager: GameManager):
		self.room_group_name = f"{game_name}_tournament_{room_name}"
		self.tournament_status = self.TournamentStatus.TO_SETUP
		self.game_manager: GameManager = game_manager
		self.channel_layer = get_channel_layer()
		self.tournament_player = PLAYER_NUMBER
		self.update_lock = asyncio.Lock()
		self.room_name = room_name

		self.players: list = []
		self.all_players: list = []
		self.bracket: list = []
		self.current_round_winners: list = []  
		self.current_round_index: int = 0
		self.match_played: int = 0
		self.game_loop_task = None

	async def broadcast_message(self, message: dict):
		await self.channel_layer.group_send(self.room_group_name, message)

	async def manage_event(self, data: dict, match_manager):
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
			# case "unexpected_quit":
			# 	await self.quit(data, match_manager)
			# case "quit_game":
			# 	await self.quit(data, match_manager)
			case _:
				print(f"Unhandled event type: {event_type}. Full data: {data}")

	async def quit(self, data: dict, match_manager):
		
		id = data.get("player_id",None)
		if id == None:
			print("cant find id value")
			return
		
		players_id = list(self.game_manager.players.keys())
		
		if id in players_id:
			print(f"player with id  {id} is playing a game")
			await self.game_manager.clear_and_save(False, id)
		elif self.tournament_status == Tournament.TournamentStatus.TO_SETUP:
			self.tournament_status = Tournament.TournamentStatus.PLAYER_DISCONNECTED
			snapshot = self.to_dict()
			await self.broadcast_message({
				"type": "lobby_state",
				"event": "tournament_finished",
				"tournament_snapshot": snapshot,
			})
		else:
			print(f"player with id  {id} is not playing a game")
			# for player in self.players:
			# 	if player["id"] == id:
			# 		self.players.remove(player)
		
	def setup_first_round(self):
		print(f" setup_first_round ")
		"""Builds the first round from the joined players."""
		if len(self.players) < MATCH_PLAYER_NUMBER:
			print("Not enough players to start a tournament.")
			return
		matches = []
		players_queue = list({player["id"] for player in self.players})
		while len(players_queue) >= MATCH_PLAYER_NUMBER:
			match = [players_queue.pop(0), players_queue.pop(0)]
			matches.append(match)
		self.bracket = [matches]
		self.current_round_winners = []
		self.current_round_index = 0
		print(f" setup_first_round end")

	async def setup_next_round(self, winners: list):
		"""Creates the next round from the winners of the previous round.
		   If there's an odd number of winners, the last one gets a bye."""
		print(f" setup_next_round ")
		if len(winners) < MATCH_PLAYER_NUMBER:
			await self.close_and_save()
			return

		next_round_matches = []
		winners_queue = winners[:]

		while len(winners_queue) >= MATCH_PLAYER_NUMBER:
			match = [winners_queue.pop(0), winners_queue.pop(0)]
			next_round_matches.append(match)

		self.current_round_winners = []

		if next_round_matches:
			self.bracket.append(next_round_matches)
		self.current_round_index += 1
		print(f" setup_next_round  end")

	async def setup_pong_manager(self):
		"""Prepares the next match from the current round in the bracket."""
		print(f" setup_pong_manager")

		# Ensure there is a current round.
		if not self.bracket or self.current_round_index >= len(self.bracket):
			print("No more matches available in the bracket.")
			return

		current_round_matches = self.bracket[self.current_round_index]

		if not current_round_matches:
			print("test 1", flush=True)
			print(f"test {self.bracket} ", flush=True)
			print(f"test {self.current_round_index}", flush=True)
			print(f"test {self.current_round_winners}", flush=True)
			print("test 1", flush=True)

			if self.current_round_winners:
				print("test 2", flush=True)
				await self.setup_next_round(self.current_round_winners)
				print("test 3", flush=True)
				if len(self.current_round_winners) == 1:
					print("test 4", flush=True)
					return
				current_round_matches = self.bracket[self.current_round_index]
				print("test 5", flush=True)
			else:
				print("No winners to set up next round.",flush=True)
				return

		# Start the next match in the current round.
		match = current_round_matches.pop(0)
		self.game_manager.reset()
		self.game_loop_task = None
		await self.game_manager.add_player(match[0], False)
		await self.game_manager.add_player(match[1], False)
		self.tournament_status = self.TournamentStatus.TO_SETUP

		snapshot = self.to_dict()
		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_to_setup",
			"players": [match[0] , match[1]],
			"tournament_snapshot": snapshot,
		})
		print(f" setup_pong_manager end")

	async def tournament_start(self):
		"""Starts the tournament by kicking off the game loop and the first match."""
		print(f" tournament_start")

		if not self.bracket:
			print("Tournament not set up properly.")
			return

		print("as as as as as a a aas asasasa s as")

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
		print(f" tournament_start end")

	@database_sync_to_async
	def get_serialized_user(self, player_id):
		"""Fetches user and serializes data in a synchronous context."""
		try:
			user = User.objects.get(id=player_id)
			serializer = SimpleUserProfileSerializer(user)
			return serializer.data
		except User.DoesNotExist:
			return None

	async def add_player_to_tournament(self, data: dict):
		print(f" add_player_to_tournament")

		if not data.get("player_id"):
			raise ValueError("Invalid data: 'player_id' is required.")

		player_id = data.get("player_id")
		data = await self.get_serialized_user(player_id)

		if not data:
			print(f"Error: data not found for id {player_id}")
			return

		self.players.append({
			"id": data.get("id", "Unknown"),
			"username": data.get("username", "Unknown"),
			"image_url": data.get("image_url", {})
		})

		await self.broadcast_message({
			"type": "lobby_state",
			"event_name": "player_join",
			"players": self.players,
		})

		if len(self.players) == PLAYER_NUMBER:
			self.all_players = self.players
			self.setup_first_round()
		print(f" add_player_to_tournament end")

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
			print(f" score {self.game_manager.scores}", flush=True)
			print(f" lucaaaa", flush=True)
			loser_id = self.game_manager.get_loser()
			winner_id = self.game_manager.get_winner()
			self.current_round_winners.append(winner_id)
			self.tournament_status = self.TournamentStatus.ENDED

			self.match_played += 1
			try:
				if self.match_played == 3:
					print(f" end", flush=True)
					await self.close_and_save()
				else:
					print(f" alleto", flush=True)

					snapshot = self.to_dict()
					await self.broadcast_message({
						"type": "lobby_state",
						"event": "match_finished",
						"loser_id": loser_id,
						"tournament_snapshot": snapshot,
					})
			except Exception as e:
				print(f" error game loop {e}")
	
	async def close_and_save(self):
		try:
			snapshot = self.to_dict()
			tournament: PongTournament = await database_sync_to_async(PongTournament.objects.create)()
			await tournament.add_players_to_tournament(list({player["id"] for player in self.all_players}))
			await tournament.set_winner(self.current_round_winners[0])

			await self.broadcast_message({
				"type": "lobby_state",
				"event": "tournament_finished",
				"winner_id": self.current_round_winners[0],
				"tournament_snapshot": snapshot,
			})
		except Exception as e:
			print(f" test {e}",flush=True)
	
	def to_dict(self) -> dict:
		tournament_data = {
			"current_tournament_status": self.tournament_status.name,
			"players": self.players
		}
		tournament_data.update(self.game_manager.to_dict())
		return tournament_data