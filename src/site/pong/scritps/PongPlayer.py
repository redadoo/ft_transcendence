from pong.scritps import constants
from utilities.Player import Player

class PongPlayer(Player):

	def __init__(self, player_id, x, color):
		super().__init__(player_id)
		self.x = x
		self.y = 0
		self.height = constants.PADDLE_HEIGHT
		self.width = constants.PADDLE_WIDTH
		self.depth = constants.PADDLE_DEPTH
		self.speed = constants.PADDLE_SPEED
		self.color = color
		self.isMovingUp = False
		self.isMovingDown = False

	def player_loop(self):

		if self.isMovingUp and self.y + self.speed + self.height / 2 < constants.GAME_BOUNDS["yMax"]:
			self.y += self.speed

		if self.isMovingDown and self.y - self.speed - self.height / 2 > constants.GAME_BOUNDS["yMin"]:
			self.y -= self.speed

	def update_player_data(self, data: dict):
		event_type = data.get("action_type")
		key = data.get("key")

		if event_type == "key_down":
			if key == "KeyW":
				self.isMovingUp = True
			elif key == "KeyS":
				self.isMovingDown = True
		elif event_type == "key_up":
			if key == "KeyW":
				self.isMovingUp = False
			elif key == "KeyS":
				self.isMovingDown = False

	def player_disconnection(self):
		"""
		Abstract method for handling player-specific disconnection logic.
		Subclasses must implement this.
		"""
		pass

	def to_dict(self):
		"""Converte l'oggetto in un dizionario per il broadcasting."""
		
		base_dict = super().to_dict()
		base_dict.update({
			"x": self.x,
			"y": self.y,
			"height": self.height,
			"width": self.width,
			"depth": self.depth,
			"speed": self.speed,
			"color": self.color,
			"isMovingUp": self.isMovingUp,
			"isMovingDown": self.isMovingDown,
		})
		return base_dict
