import asyncio
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps.PongPlayer import PongPlayer
from utilities.GameManager import GameManager

class PongGameManager(GameManager):
	def __init__(self) -> None:
		super().__init__(2)
		self.ball = Ball()
		self.scores = {
			"player1": 0,
			"player2": 0,
		}

	def init_player(self, players):
		if len(players) != 2 or len(set(players)) != 2:
			raise ValueError("Two unique player IDs are required to initialize players.")

		self.players[players[0]] = PongPlayer(
			player_id=players[0],
			x=constants.GAME_BOUNDS["xMin"] + 1,
			color=constants.PADDLE_COLOR,
		)

		self.players[players[1]] = PongPlayer(
			player_id=players[1],
			x=constants.GAME_BOUNDS["xMax"] - 1,
			color=constants.PADDLE_COLOR,
		)

	def init_game_loop(self):
		# self.game_loop_task = asyncio.create_task(self.game_loop())
		print("init_game_loop")

	def update_player(self, data):
		print("update_player")

	def player_disconnected(self, player_id):
		if player_id in self.players:
			self.players[player_id].status = PongPlayer.PlayerConnectionState.DISCONNECTED
			print(f"Player {player_id} marked as disconnected.")
		else:
			print(f"Error: Player ID {player_id} not found in players.")

	async def game_loop(self):
		print("game_loop")

	def to_dict(self):
		"""
		Convert the current game state to a dictionary.
		Includes ball, scores, and game bounds.
		"""

		base_dict = super().to_dict()
		base_dict.update({
			"ball": self.ball.to_dict(),
			"scores": self.scores,
			"bounds": constants.GAME_BOUNDS,
		})
		return base_dict
