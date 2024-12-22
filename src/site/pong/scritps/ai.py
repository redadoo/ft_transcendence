import random
import asyncio
from pong.scritps import constants

# TODO need to be refactored
class PongAI:
	"""
	AI for controlling a Pong player.

	The PongAI class allows a player controlled by the AI to move and track the ball. 
	The AI makes decisions based on the ball's position and speed, and it reacts with delays to mimic human behavior.
	"""
	def __init__(self, player):
		"""
		Initializes the PongAI object.

		Args:
			TODO
		"""
		self.player = player
		self.current_target = None
		self.last_decision_time = 0
		self.decision_delay = 1
		self.tracking_ball = False
		self.returning_to_center = False
		self.waiting = False

	def update_position(self, ball):
		"""
		Updates the position of the AI-controlled player based on the ball's position.

		This method makes the AI move its paddle towards the predicted ball trajectory. 
		It includes decision-making delays and waits for the ball to come back into play.
		
		Args:
			ball (Ball): The ball object, used to determine the ball's position and speed.
		"""
		current_time = asyncio.get_event_loop().time()
		paddle_y = self.player.y
		paddle_speed = self.player.speed
		paddle_height = self.player.height

		ball_y = ball.y
		ball_speed_x = ball.speed_x
		ball_speed_y = ball.speed_y
		
		# Calculate the Y-axis limits reachable by the paddle
		min_y_reachable = constants.GAME_BOUNDS["yMin"] + paddle_height / 2
		max_y_reachable = constants.GAME_BOUNDS["yMax"] - paddle_height / 2

		# Move towards the current target (if set)
		if self.current_target is not None:
			distance_to_target = self.current_target - paddle_y
			move = min(abs(distance_to_target), paddle_speed)
			self.player.y += move * (1 if distance_to_target > 0 else -1)

			if abs(distance_to_target) <= paddle_speed:
				self.waiting = True
				self.current_target = None
				self.tracking_ball = False
				self.returning_to_center = False

		# Wait for decision delay before recalculating target
		if current_time - self.last_decision_time < self.decision_delay:
			return

		self.last_decision_time = current_time

		# Ensure the paddle stays within bounds
		self.player.y = max(min_y_reachable, min(max_y_reachable, self.player.y))

		# Reset the waiting state when necessary
		if ball_speed_x > 0 and self.waiting and not self.tracking_ball:
			self.waiting = False
		elif ball_speed_x < 0 and self.waiting and not self.returning_to_center:
			self.waiting = False

		# Determine new target position based on ball's position and direction
		if not self.waiting:
			if ball_speed_x > 0 and not self.tracking_ball:
				self.tracking_ball = True
				self.returning_to_center = False
			elif ball_speed_x < 0 and not self.returning_to_center:
				self.tracking_ball = False
				self.returning_to_center = True

			if self.tracking_ball and self.current_target is None:
				# Calculate the time it will take for the ball to reach the paddle
				time_to_reach_paddle = abs((self.player.x - ball.x) / (ball_speed_x * ball.speed_multiplier))
				predicted_y = ball_y + ball_speed_y * time_to_reach_paddle

				# Simulate vertical bounces with more accuracy
				num_bounces = 0
				while predicted_y < constants.GAME_BOUNDS["yMin"] or predicted_y > constants.GAME_BOUNDS["yMax"]:
					if predicted_y < constants.GAME_BOUNDS["yMin"]:
						predicted_y = constants.GAME_BOUNDS["yMin"] + (constants.GAME_BOUNDS["yMin"] - predicted_y)
					elif predicted_y > constants.GAME_BOUNDS["yMax"]:
						predicted_y = constants.GAME_BOUNDS["yMax"] - (predicted_y - constants.GAME_BOUNDS["yMax"])

					num_bounces += 1

					# Limit the number of bounces to avoid infinite loops
					if num_bounces > 5:
						break

				# Set the target position on the Y-axis for the paddle
				self.current_target = max(min_y_reachable, min(max_y_reachable, predicted_y))

			elif self.returning_to_center and self.current_target is None:
				# Calculate the center position of the paddle
				center_target = (constants.GAME_BOUNDS["yMax"] + constants.GAME_BOUNDS["yMin"]) / 2
				offset = random.uniform(-2, 2) # Add some randomness to the center
				self.current_target = max(min_y_reachable, min(max_y_reachable, center_target + offset))
