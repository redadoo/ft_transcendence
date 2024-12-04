
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps.pong_player import PongPlayer

class PongGameManger:

	def __init__(self) -> None:
		self.players = {}
		
		self.ball = Ball()
		
		self.score = { 
			"player": 0,
			"player2": 0,
		}

	def init_player(self, players):

		self.players[players[0].id] = PongPlayer(
			player_id=players[0].id,
			x=constants.GAME_BOUNDS["xMin"] + 1,
			color=constants.PADDLE_COLOR,
		)

		self.players[players[1].id] = PongPlayer(
			player_id=players[1].id,
			x=constants.GAME_BOUNDS["xMax"] - 1,
			color=constants.PADDLE_COLOR,
		)

	def to_dict(self):
		"""
		Converts the PongGameManger to a dictionary with current gamestatus and score.
		"""

		return {
			"current_gamestatus": self.current_gamestatus.name,
			"scores": self.score
		}