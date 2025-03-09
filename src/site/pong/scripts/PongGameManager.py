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
	
	def __init__(self):
		"""
		Initialize the Pong game manager with a maximum of 2 players, ball, and score tracking.
		"""
		super().__init__(max_players=2)
		self.ball = Ball()
		self.scores = {"player1": 0, "player2": 0}
		self.is_countdown_finish = False
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
			first_player = await database_sync_to_async(User.objects.get)(id=players_list[0])
			second_player = await database_sync_to_async(User.objects.get)(id=players_list[1])

			if not is_game_ended:
				if player_disconnected_id == players_list[0]:
					self.scores["player1"], self.scores["player2"] = 0, 5
				else:
					self.scores["player1"], self.scores["player2"] = 5, 0

			if all(val > 0 for val in players_list):
				first_user_mmr_gain = PongMatch.static_get_player_mmr_gained(True, self.scores["player1"], self.scores["player2"])	
				second_user_mmr_gain = PongMatch.static_get_player_mmr_gained(False, self.scores["player1"], self.scores["player2"])
			else:
				first_user_mmr_gain = 0
				second_user_mmr_gain = 0
			match = await database_sync_to_async(PongMatch.objects.create)(
				first_user=first_player,
				second_user=second_player,
				first_user_score=self.scores["player1"],
				second_user_score=self.scores["player2"],
				first_user_mmr_gain=first_user_mmr_gain,
				second_user_mmr_gain=second_user_mmr_gain,
				start_date=self.start_match_timestamp or timezone.now()
			)
			await database_sync_to_async(match.save)()
			try:
				first_player_stats = await database_sync_to_async(
					lambda: UserStats.objects.select_related('user').get(user=first_player)
				)()
				second_player_stats = await database_sync_to_async(
					lambda: UserStats.objects.select_related('user').get(user=second_player)
				)()
			except UserStats.DoesNotExist:
				print(f"UserStats not found for user: {first_player.username}")
				return

			first_player_stats.update_with_match_info(match)
			second_player_stats.update_with_match_info(match)

			await database_sync_to_async(first_player_stats.save)()
			await database_sync_to_async(second_player_stats.save)()

			player1_history, _ = await database_sync_to_async(MatchHistory.objects.get_or_create)(user=first_player)
			player2_history, _ = await database_sync_to_async(MatchHistory.objects.get_or_create)(user=second_player)
			async def add_match_to_history(history):
				await database_sync_to_async(history.add_pong_match)(match)
				await database_sync_to_async(history.save)()
			await add_match_to_history(player1_history)
			await add_match_to_history(player2_history)

		except Exception as e:
			raise ValueError(f"error while saving the match: {str(e)}")

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
				self.ball.reset()

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
		self.ball.reset()
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


