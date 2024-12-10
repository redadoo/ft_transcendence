
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps.pong_player import PongPlayer

class PongGameManager:

	def __init__(self) -> None:
		self.max_players = 2
		
		self.players = {}
		
		self.ball = Ball()
		
		self.score = { 
			"player": 0,
			"player2": 0,
		}

	def init_player(self, players):

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

	def player_disconnected(self, player_id):
		try:
			self.players[player_id].status = PongPlayer.PlayerConnectionState.DISCONNECTED
		except Exception as e:
			print(f"Error: {e} when search for disconnected player")
			raise

	def to_dict(self):
		"""
		Converts the PongGameManger to a dictionary with current gamestatus and score.
		"""

		return {
			"scores": self.score,
			"ball": self.ball.to_dict(),
			"bounds": constants.GAME_BOUNDS,
			"players": {player_id: player.to_dict() for player_id, player in self.players.items()},
		}