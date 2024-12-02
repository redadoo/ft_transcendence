import random
import asyncio
from pong.scritps import constants

class PongAI:
	def __init__(self, player):
		self.player = player
		self.current_target = None
		self.last_decision_time = 0
		self.decision_delay = 1
		self.tracking_ball = False
		self.returning_to_center = False
		self.waiting = False

	def update_position(self, ball):
		current_time = asyncio.get_event_loop().time()
		paddle_y = self.player.y
		paddle_speed = self.player.speed
		paddle_height = self.player.height

		ball_y = ball.y
		ball_speed_x = ball.speed_x
		ball_speed_y = ball.speed_y
		# Calcola i limiti di Y raggiungibili dalla paddle
		min_y_reachable = constants.GAME_BOUNDS["yMin"] + paddle_height / 2
		max_y_reachable = constants.GAME_BOUNDS["yMax"] - paddle_height / 2

		# Movimento verso la destinazione
		if self.current_target is not None:
			distance_to_target = self.current_target - paddle_y
			move = min(abs(distance_to_target), paddle_speed)
			self.player.y += move * (1 if distance_to_target > 0 else -1)

			if abs(distance_to_target) <= paddle_speed:
				self.waiting = True
				self.current_target = None
				self.tracking_ball = False
				self.returning_to_center = False

		# Aspetta il delay decisionale prima di calcolare un nuovo target
		if current_time - self.last_decision_time < self.decision_delay:
			return

		self.last_decision_time = current_time

		# Limita i bordi
		self.player.y = max(min_y_reachable, min(max_y_reachable, self.player.y))

		# Reset dello stato di attesa
		if ball_speed_x > 0 and self.waiting and not self.tracking_ball:
			self.waiting = False
		elif ball_speed_x < 0 and self.waiting and not self.returning_to_center:
			self.waiting = False

		# Calcolo del target
		if not self.waiting:
			if ball_speed_x > 0 and not self.tracking_ball:
				self.tracking_ball = True
				self.returning_to_center = False
			elif ball_speed_x < 0 and not self.returning_to_center:
				self.tracking_ball = False
				self.returning_to_center = True

			if self.tracking_ball and self.current_target is None:
				# Calcola il tempo di volo della palla fino alla paddle
				time_to_reach_paddle = abs((self.player.x - ball.x) / (ball_speed_x * ball.speed_multiplier))
				predicted_y = ball_y + ball_speed_y * time_to_reach_paddle

				# Simula i rimbalzi verticali in modo più accurato
				num_bounces = 0
				while predicted_y < constants.GAME_BOUNDS["yMin"] or predicted_y > constants.GAME_BOUNDS["yMax"]:
					if predicted_y < constants.GAME_BOUNDS["yMin"]:
						predicted_y = constants.GAME_BOUNDS["yMin"] + (constants.GAME_BOUNDS["yMin"] - predicted_y)
					elif predicted_y > constants.GAME_BOUNDS["yMax"]:
						predicted_y = constants.GAME_BOUNDS["yMax"] - (predicted_y - constants.GAME_BOUNDS["yMax"])

					num_bounces += 1

					# Limita il numero di rimbalzi a 5 per evitare loop infiniti
					if num_bounces > 5:
						break

				# Setta il nuovo target
				self.current_target = max(min_y_reachable, min(max_y_reachable, predicted_y))

			elif self.returning_to_center and self.current_target is None:
				center_target = (constants.GAME_BOUNDS["yMax"] + constants.GAME_BOUNDS["yMin"]) / 2
				offset = random.uniform(-2, 2)
				self.current_target = max(min_y_reachable, min(max_y_reachable, center_target + offset))
