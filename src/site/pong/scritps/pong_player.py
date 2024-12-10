from enum import Enum
from pong.scritps import constants

class PongPlayer:

	class PlayerConnectionState(Enum):
		CONNECTED = 0
		DISCONNECTED = 1

	def __init__(self, player_id, x,  color):

		self.status = PongPlayer.PlayerConnectionState.CONNECTED
		self.id = player_id
		self.x = x
		self.y = 0
		self.height = constants.PADDLE_HEIGHT
		self.width = constants.PADDLE_WIDTH
		self.depth = constants.PADDLE_DEPTH
		self.speed = constants.PADDLE_SPEED
		self.color = color
		self.isMovingUp = False
		self.isMovingDown = False


	def update_player_position(self):
		# Muovi il giocatore verso l'alto, rispettando i limiti
		if self.isMovingUp and self.y + self.speed + self.height / 2 < constants.GAME_BOUNDS["yMax"]:
			self.y += self.speed
		# Muovi il giocatore verso il basso, rispettando i limiti
		if self.isMovingDown and self.y - self.speed - self.height / 2 > constants.GAME_BOUNDS["yMin"]:
			self.y -= self.speed

	def to_dict(self):
		"""Converte l'oggetto in un dizionario per il broadcasting."""
		data = {
			"status": self.status.name,
			"id": self.id,
			"x": self.x,
			"y": self.y,
			"height": self.height,
			"width": self.width,
			"depth": self.depth,
			"speed": self.speed,
			"color": self.color,
			"isMovingUp": self.isMovingUp,
			"isMovingDown": self.isMovingDown,
		}
		return data
