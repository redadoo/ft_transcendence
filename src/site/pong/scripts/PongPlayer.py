from pong.scripts import constants
from utilities.Player import Player
from pong.scripts.Paddle import Paddle

class PongPlayer(Player):
	"""
	Represents a player in the Pong game.
	"""

	def __init__(self, player_id: int, x: int, color: int):
		"""
        Initialize a PongPlayer instance.

        :param player_id: Unique identifier for the player.
        :param x: The initial horizontal position of the paddle.
        :param color: The color of the paddle.
        """
		super().__init__(player_id)
		self.paddle = Paddle(color,x)
		self.isMovingUp = False
		self.isMovingDown = False

	def player_loop(self):
		"""
		Updates the player's position based on the current movement state.
		Ensures the paddle remains within the game bounds.
		"""
		if self.can_move("up"):
			self.paddle.y += self.paddle.speed
		if self.can_move("down"):
			self.paddle.y -= self.paddle.speed

	def can_move(self, direction: str) -> bool:
		"""
		Checks if the paddle can move in a given direction within bounds.

		:param direction: Direction to check ("up" or "down").
		:return: True if movement is possible; otherwise, False.
		"""
		if direction == "up":
			return self.isMovingUp and self.paddle.y + self.paddle.speed + self.paddle.height / 2 < constants.GAME_BOUNDS["yMax"]
		elif direction == "down":
			return self.isMovingDown and self.paddle.y - self.paddle.speed - self.paddle.height / 2 > constants.GAME_BOUNDS["yMin"]
		return False

	def update_player_data(self, data: dict):
		"""
		Processes input data to update the paddle's movement state.
		
		:param data: A dictionary containing input data:
					- "action_type": Type of action ("key_down" or "key_up").
					- "key": Key pressed or released ("KeyW" or "KeyS").
		:raises ValueError: If required keys are missing or values are invalid.
		"""
		try:
			if "action_type" not in data or "key" not in data:
				raise ValueError("Missing required keys: 'action_type' and 'key'.")
			
			event_type = data.get("action_type")
			key = data.get("key")

			if event_type not in {"key_down", "key_up"}:
				raise ValueError(f"Invalid action_type: {event_type}. Expected 'key_down' or 'key_up'.")
			
			if key not in {"KeyW", "KeyS"}:
				raise ValueError(f"Invalid key: {key}. Expected 'KeyW' or 'KeyS'.")

			is_pressed = event_type == "key_down"
			if key == "KeyW":
				self.isMovingUp = is_pressed
			elif key == "KeyS":
				self.isMovingDown = is_pressed

		except (TypeError, ValueError) as e:
			print(f"Error in update_player_data: {e}")

	def player_disconnection(self):
		super().player_disconnection()

	def to_dict(self) -> dict:
		"""
		Converts the PongPlayer object to a dictionary for broadcasting.

		:return: A dictionary containing the player's state and attributes.
		"""
		base_dict = super().to_dict()
		base_dict.update(self.paddle.to_dict())
		base_dict.update({
			"isMovingUp": self.isMovingUp,
			"isMovingDown": self.isMovingDown,
		})
		return base_dict
