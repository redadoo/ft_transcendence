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
		self.bounds = constants.GAME_BOUNDS  # Limiti del campo di gioco
		self.speed_multiplier = 1.0  # Fattore di incremento della velocità
		
	def reset(self):
		"""Imposta la palla al centro dello schermo con una direzione casuale."""
		self.x = (self.bounds["xMin"] + self.bounds["xMax"]) / 2
		self.y = (self.bounds["yMin"] + self.bounds["yMax"]) / 2
		self.speed_multiplier = 1.0

		# Genera un angolo casuale tra -pi/4 e pi/4 (da -45° a 45°)
		angle = random.uniform(-math.pi / 4, math.pi / 4)
		direction_x = random.choice([-1, 1])  # -1 = sinistra, 1 = destra

		speed_x = direction_x * math.cos(angle)
		speed_y = math.sin(angle)
		# Normalizzazione del vettore
		speed_magnitude = math.sqrt(speed_x**2 + speed_y**2)
		if speed_magnitude != 0:
			speed_x /= speed_magnitude
			speed_y /= speed_magnitude

		# Applica la velocità
		self.speed_x = constants.BALL_SPEED_X * speed_x
		self.speed_y = constants.BALL_SPEED_Y * speed_y

	def update_position(self):
		"""Aggiorna la posizione della palla in base alla velocità corrente."""
		self.x += self.speed_x * self.speed_multiplier
		self.y += self.speed_y * self.speed_multiplier

		# Controlla i rimbalzi contro i muri superiori e inferiori
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

		# Calcola i bordi della paddle
		paddle_left = paddle_x - paddle_width / 2
		paddle_right = paddle_x + paddle_width / 2
		paddle_top = paddle_y - paddle_height / 2
		paddle_bottom = paddle_y + paddle_height / 2

		# Trova il punto più vicino della paddle alla palla
		closest_x = max(paddle_left, min(self.x, paddle_right))
		closest_y = max(paddle_top, min(self.y, paddle_bottom))

		# Calcola la distanza tra il centro della palla e il punto più vicino della paddle
		distance_x = self.x - closest_x
		distance_y = self.y - closest_y
		distance = math.sqrt(distance_x**2 + distance_y**2)

		# Se la distanza tra il centro della palla e il punto più vicino della paddle è minore o uguale al raggio, c'è una collisione
		if distance <= self.radius:
			# Correggi la posizione della palla per evitare l'interpenetrazione
			penetration = self.radius - distance
			if distance != 0:
				self.x += distance_x / distance * penetration
				self.y += distance_y / distance * penetration

			# Inverti la direzione della velocità in base alla direzione della collisione
			if closest_x == paddle_left or closest_x == paddle_right:
				self.speed_x *= -1  # Collisione laterale
			if closest_y == paddle_top or closest_y == paddle_bottom:
				self.speed_y *= -1  # Collisione verticale

			# Aggiusta la velocità verticale in base alla posizione d'impatto
			offset = (self.y - paddle_y) / (paddle_height / 2)
			self.speed_y += offset * 0.25

			# Incrementa il moltiplicatore di velocità
			self.speed_multiplier *= 1.05

			# Normalizza la velocità
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