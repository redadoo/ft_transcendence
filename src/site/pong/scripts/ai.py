import random
import asyncio
from pong.scripts import constants
from pong.scripts.Paddle import Paddle

class PongAI():

	def __init__(self, players_id, ball, x, color):
		self.paddle = Paddle(color, x)
		self.ball = ball
		self.player_id = players_id

		self.current_target = None
		self.last_decision_time = 0
		self.decision_delay = 1
		self.tracking_ball = False
		self.returning_to_center = False
		self.waiting = False


	def player_loop(self):
		"""
		Updates the position of the AI-controlled player based on the ball's position.

		This method makes the AI move its paddle towards the predicted ball trajectory. 
		It includes decision-making delays and waits for the ball to come back into play.
		
		Args:
			ball (Ball): The ball object, used to determine the ball's position and speed.
		"""
		
		current_time = asyncio.get_event_loop().time()
		
		# Calculate the Y-axis limits reachable by the paddle
		min_y_reachable = constants.GAME_BOUNDS["yMin"] + self.paddle.height / 2
		max_y_reachable = constants.GAME_BOUNDS["yMax"] - self.paddle.height / 2

		# Move towards the current target (if set)
		if self.current_target is not None:
			distance_to_target = self.current_target - self.paddle.y
			move = min(abs(distance_to_target), self.paddle.speed)
			self.paddle.y += move * (1 if distance_to_target > 0 else -1)

			if abs(distance_to_target) <= self.paddle.speed:
				self.waiting = True
				self.current_target = None
				self.tracking_ball = False
				self.returning_to_center = False

		# Wait for decision delay before recalculating target
		if current_time - self.last_decision_time < self.decision_delay:
			return

		self.last_decision_time = current_time

		# Ensure the paddle stays within bounds
		self.paddle.y = max(min_y_reachable, min(max_y_reachable, self.paddle.y))

		# Reset the waiting state when necessary
		if self.ball.speed_x > 0 and self.waiting and not self.tracking_ball:
			self.waiting = False
		elif self.ball.speed_x < 0 and self.waiting and not self.returning_to_center:
			self.waiting = False

		# Determine new target position based on ball's position and direction
		if not self.waiting:
			if self.ball.speed_x > 0 and not self.tracking_ball:
				self.tracking_ball = True
				self.returning_to_center = False
			elif self.ball.speed_x < 0 and not self.returning_to_center:
				self.tracking_ball = False
				self.returning_to_center = True

			if self.tracking_ball and self.current_target is None:
				# Calcola il tempo per raggiungere la racchetta
				time_to_reach_paddle = abs((self.paddle.x - self.ball.x) / (self.ball.speed_x * self.ball.speed_multiplier))
				
				# Usa una copia di speed_y per la simulazione
				simulated_speed_y = self.ball.speed_y
				predicted_y = self.ball.y
				remaining_time = time_to_reach_paddle

				while remaining_time > 0:
					# Calcola la distanza verticale che la palla può percorrere prima del prossimo rimbalzo
					if simulated_speed_y > 0:
						distance_to_next_bounce = constants.GAME_BOUNDS["yMax"] - predicted_y
					else:
						distance_to_next_bounce = predicted_y - constants.GAME_BOUNDS["yMin"]

					# Calcola il tempo necessario per raggiungere il prossimo rimbalzo
					time_to_next_bounce = distance_to_next_bounce / abs(simulated_speed_y * self.ball.speed_multiplier)

					if time_to_next_bounce > remaining_time:
						# Se non c'è abbastanza tempo per un rimbalzo, aggiorna la posizione e interrompi
						predicted_y += simulated_speed_y * remaining_time * self.ball.speed_multiplier
						break
					else:
						# Altrimenti, aggiorna la posizione e il tempo rimanente
						predicted_y += simulated_speed_y * time_to_next_bounce * self.ball.speed_multiplier
						remaining_time -= time_to_next_bounce

						# Inverte la direzione verticale della palla (simula il rimbalzo)
						simulated_speed_y *= -1  # Usa la copia, non self.ball.speed_y

				# Imposta il target della racchetta
				self.current_target = max(min_y_reachable, min(max_y_reachable, predicted_y))

			elif self.returning_to_center and self.current_target is None:
				# Calculate the center position of the paddle
				center_target = (constants.GAME_BOUNDS["yMax"] + constants.GAME_BOUNDS["yMin"]) / 2
				offset = random.uniform(-2, 2) # Add some randomness to the center
				self.current_target = max(min_y_reachable, min(max_y_reachable, center_target + offset))

	def to_dict(self) -> dict:
		"""
		Converts the PongPlayer object to a dictionary for broadcasting.

		:return: A dictionary containing the player's state and attributes.
		"""

		base_dict = {"player_id": self.player_id}
		base_dict.update(self.paddle.to_dict())
		return base_dict