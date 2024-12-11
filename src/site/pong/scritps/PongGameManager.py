
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps.pong_player import PongPlayer

class PongGameManager:

	def __init__(self) -> None:
		self.max_players = 2
		
		self.players = {}
		
		self.ball = Ball()
		
		self.score = { 
			"player1": 0,
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

	def update_player(self, data):
		player_id = data.get("player_id") 
		if player_id == None:
			print(f"player_id is None when trying to get it from data")
			return
		
		action_type = data.get("action_type")
		key = data.get("key")
		if action_type == None or key == None:
			print(f"error when retrieve data for update player")
			return
		
		if action_type == 'key_down':
			if key == "KeyW":
				self.players[player_id].isMovingUp = True
			elif key == "KeyS":
				self.players[player_id].isMovingDown = True
			pass
		elif action_type == 'key_up':
			if key == "KeyW":
				self.players[player_id].isMovingUp = False
			elif key == "KeyS":
				self.players[player_id].isMovingDown = False
			pass

	def player_disconnected(self, player_id):
		try:
			self.players[player_id].status = PongPlayer.PlayerConnectionState.DISCONNECTED
		except Exception as e:
			print(f"Error: {e} when search for disconnected player")
			raise

	async def game_loop(self):
		pass

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