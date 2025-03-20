import math
import time
from pong.scripts import constants
from pong.models import *
from pong.scripts.ball import Ball
from pong.scripts.PongPlayer import PongPlayer
from utilities.GameManager import GameManager
from pong.scripts.ai import PongAI
from website.models import User, MatchHistory, UserStats
from channels.db import database_sync_to_async
from django.utils import timezone

class PongGameManager(GameManager):
	
	def __init__(self, has_ranked_value):
		"""
		Initialize the Pong game manager with a maximum of 2 players, ball, and score tracking.
		"""
		super().__init__(max_players=2)
		self.ball = Ball()
		self.scores = {"player1": 0, "player2": 0}
		self.is_countdown_finish = False
		self.has_ranked_value = has_ranked_value
		self.time_elapsed = 0

	def start_game(self):
		"""Marks the game as started."""
		self.start_match_timestamp = timezone.now()
		self.time_start_match = time.time()
		self.game_loop_is_active = True

	async def clear_and_save(self, is_game_ended: bool, player_disconnected_id: int = None):
		"""Saves the match results and updates players' match history."""
		players_list = list(self.players.keys())
		
		if len(players_list) < 2:
			print("Not enough players to save the match.")
			return

		try:
			# Fetch player objects
			first_player, second_player = await database_sync_to_async(User.objects.get)(id=players_list[0]), \
										await database_sync_to_async(User.objects.get)(id=players_list[1])

			# Handle disconnection scenario
			if not is_game_ended:
				self.scores["player1"], self.scores["player2"] = (0, 5) if player_disconnected_id == players_list[0] else (5, 0)

			# Create match record
			match: PongMatch = await database_sync_to_async(PongMatch.objects.create)(
				first_user=first_player,
				second_user=second_player,
				first_user_score=self.scores["player1"],
				second_user_score=self.scores["player2"],
				start_date=self.start_match_timestamp or timezone.now()
			)

			# Calculate MMR gains if is ranked 
			if self.has_ranked_value == True:
				match.set_player_mmr_gained()

			await database_sync_to_async(match.save)()

			# Fetch or update player statistics
			try:
				first_player_stats = await database_sync_to_async(lambda: UserStats.objects.select_related('user').get(user=first_player))()
				second_player_stats = await database_sync_to_async(lambda: UserStats.objects.select_related('user').get(user=second_player))()
			except UserStats.DoesNotExist:
				print(f"UserStats not found for user: {first_player.username}")
				return

			first_player_stats.update_with_match_info(match)
			second_player_stats.update_with_match_info(match)

			await database_sync_to_async(first_player_stats.save)()
			await database_sync_to_async(second_player_stats.save)()

			# Update match history
			async def update_match_history(player):
				history, _ = await database_sync_to_async(MatchHistory.objects.get_or_create)(user=player)
				await database_sync_to_async(history.add_pong_match)(match)
				await database_sync_to_async(history.save)()

			await update_match_history(first_player)
			await update_match_history(second_player)

		except Exception as e:
			raise ValueError(f"Error while saving the match: {str(e)}")

		self.game_loop_is_active = False

	def add_player(self, players_id: int, is_bot: bool):
		"""
		Initialize player with unique IDs and assign them to the game.

		:param players: A list of two unique player IDs.
		:raises ValueError: If there are not exactly two unique player IDs.
		"""
		if len(self.players) > 2:
			raise ValueError("Two unique player IDs are required to initialize players.")

		if isinstance(players_id, int) == False:
			players_id = int(players_id)

		pos_x = constants.GAME_BOUNDS["xMax"] - 1
		if len(self.players) == 0:
			pos_x = constants.GAME_BOUNDS["xMin"] + 1

		if is_bot == True:
			self.players[players_id] = PongAI(players_id, self.ball, pos_x, constants.PADDLE_COLOR)
		else:
			self.players[players_id] = PongPlayer(
				player_id=players_id,
				x=pos_x,
				color=constants.PADDLE_COLOR,
			)

	def update_player(self, data: dict):
		"""
		Update player data based on the provided dictionary.

		:param data: Dictionary containing player update data.
		:raises KeyError: If the player ID is not found.
		"""
		try:
			player_id = data.get("playerId")
			if player_id not in self.players:
				raise KeyError(f"Player ID {player_id} not found.")

			self.players[player_id].update_player_data(data)
		except (KeyError, ValueError) as e:
			print(f"Error updating player data: {e}")

	def player_disconnected(self, player_id: int):
		"""
		Handle logic for when a player disconnects.

		:param player_id: The ID of the player to mark as disconnected.
		"""
		player = self.players.get(player_id)
		if player:
			self.players.pop(player_id)
			print(f"Player {player_id} marked as disconnected.")
		else:
			print(f"Error: Player ID {player_id} not found in players.")

	async def game_loop(self):
		"""
		Core game loop that updates the state of the players, ball, and handles collisions.
		"""		
		if self.is_countdown_finish == False:
			self.time_elapsed = time.time() - self.time_start_match
			if self.time_elapsed >= constants.COUNTDOWN:
				self.is_countdown_finish = True

		if self.is_countdown_finish == True:
			players = self.players.values()

			for player in players:
				player.player_loop()

			self.ball.update_position()
			for player in players:
				self.ball.handle_paddle_collision(player.paddle)

			out_of_bounds = self.ball.is_out_of_bounds()
			if out_of_bounds in {"right", "left"}:
				scoring_player = "player1" if out_of_bounds == "right" else "player2"
				self.scores[scoring_player] += 1
				self.ball.reset(scoring_player)

			if any(score >= constants.MAX_SCORE for score in self.scores.values()):
				await self.clear_and_save(True)
				return

	def get_loser(self):
		player_list = list(self.players)

		if self.scores["player1"] > self.scores["player2"]:
			return player_list[1]
		return player_list[0]

	def get_winner(self):
		player_list = list(self.players)

		if self.scores["player1"] > self.scores["player2"]:
			return player_list[0]
		return player_list[1]

	def reset(self):
		self.players.clear()
		self.ball.start()
		self.scores = {"player1": 0, "player2": 0}
		self.game_loop_is_active = False
		self.is_countdown_finish = False
		self.time_elapsed = 0

	def to_dict(self) -> dict:
		"""
		Convert the current game state to a dictionary.

		:return: Dictionary containing the game state, including players, ball, scores, and bounds.
		"""
		base_dict = super().to_dict()
		base_dict.update({
			"ball": self.ball.to_dict(),
			"scores": self.scores,
			"bounds": constants.GAME_BOUNDS,
			"count_down": math.ceil(constants.COUNTDOWN - self.time_elapsed)
		})
		return base_dict