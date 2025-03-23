import random
import math
from pong.scripts import constants

# TODO need to be refactored
class Ball:
	
	def __init__(self):
		self.x = constants.BALL_POSITION[0]
		self.y = constants.BALL_POSITION[1]
		self.radius = constants.BALL_RADIUS
		self.speed_x = constants.BALL_SPEED_X
		self.speed_y = constants.BALL_SPEED_Y
		self.bounds = constants.GAME_BOUNDS 
		self.speed_multiplier = 1.0
		
	def start(self):
		"""Imposta la palla al centro dello schermo con una direzione casuale."""
		self.x = (self.bounds["xMin"] + self.bounds["xMax"]) / 2
		self.y = (self.bounds["yMin"] + self.bounds["yMax"]) / 2
		self.speed_multiplier = 1.0

		angle = random.uniform(-math.pi / 4, math.pi / 4)
		direction_x = random.choice([-1, 1])
		speed_x = direction_x * math.cos(angle)
		speed_y = math.sin(angle)
		speed_magnitude = math.sqrt(speed_x**2 + speed_y**2)
		if speed_magnitude != 0:
			speed_x /= speed_magnitude
			speed_y /= speed_magnitude

		self.speed_x = constants.BALL_SPEED_X * speed_x
		self.speed_y = constants.BALL_SPEED_Y * speed_y

	def reset(self, scored_player):
		"""Imposta la palla al centro e la manda verso il giocatore che ha subito il punto."""
		self.x = (self.bounds["xMin"] + self.bounds["xMax"]) / 2
		self.y = (self.bounds["yMin"] + self.bounds["yMax"]) / 2
		self.speed_multiplier = 1.0

		if scored_player == "player1":
			direction_x = 1
		else:
			direction_x = -1
		angle = random.uniform(-math.pi / 4, math.pi / 4)

		speed_x = direction_x * math.cos(angle)
		speed_y = math.sin(angle)

		speed_magnitude = math.sqrt(speed_x**2 + speed_y**2)
		if speed_magnitude != 0:
			speed_x /= speed_magnitude
			speed_y /= speed_magnitude

		self.speed_x = constants.BALL_SPEED_X * speed_x
		self.speed_y = constants.BALL_SPEED_Y * speed_y
  
	def update_position(self):
		"""Aggiorna la posizione della palla in base alla velocità corrente."""
		self.x += self.speed_x * self.speed_multiplier
		self.y += self.speed_y * self.speed_multiplier

		if self.y + self.radius > self.bounds["yMax"]:
			self.y = self.bounds["yMax"] - self.radius
			self.speed_y *= -1
		elif self.y - self.radius < self.bounds["yMin"]:
			self.y = self.bounds["yMin"] + self.radius
			self.speed_y *= -1

	def is_out_of_bounds(self):
		"""Verifica se la palla è uscita dai limiti laterali."""
		if self.x + self.radius > self.bounds["xMax"]:
			return "right"
		elif self.x - self.radius < self.bounds["xMin"]:
			return "left"
		return None

	def handle_paddle_collision(self, paddle):
		"""Gestisce le collisioni con una paddle considerando l'intera superficie della palla."""

		paddle_x = paddle.x
		paddle_y = paddle.y
		paddle_width = paddle.width
		paddle_height = paddle.height

		paddle_left = paddle_x - paddle_width / 2
		paddle_right = paddle_x + paddle_width / 2
		paddle_top = paddle_y - paddle_height / 2
		paddle_bottom = paddle_y + paddle_height / 2

		closest_x = max(paddle_left, min(self.x, paddle_right))
		closest_y = max(paddle_top, min(self.y, paddle_bottom))

		distance_x = self.x - closest_x
		distance_y = self.y - closest_y
		distance = math.sqrt(distance_x**2 + distance_y**2)

		if distance <= self.radius:
			penetration = self.radius - distance
			if distance != 0:
				self.x += distance_x / distance * penetration
				self.y += distance_y / distance * penetration

			if closest_x == paddle_left or closest_x == paddle_right:
				self.speed_x *= -1
			if closest_y == paddle_top or closest_y == paddle_bottom:
				self.speed_y *= -1

			offset = (self.y - paddle_y) / (paddle_height / 2)
			self.speed_y += offset * 0.15

			self.speed_multiplier *= 1.05
			if self.speed_multiplier > 2.5:
				self.speed_multiplier = 2.5

			speed_magnitude = math.sqrt(self.speed_x**2 + self.speed_y**2)
			if speed_magnitude != 0:
				self.speed_x = (self.speed_x / speed_magnitude) * constants.BALL_SPEED_X
				self.speed_y = (self.speed_y / speed_magnitude) * constants.BALL_SPEED_X

	def to_dict(self):
		return {
			"x": self.x,
			"y": self.y,
			"radius": self.radius,
			"speed_x": self.speed_x,
			"speed_y": self.speed_y,
			"bounds": self.bounds,
		}