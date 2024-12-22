import asyncio
from pong.scritps import constants
from pong.scritps.ball import Ball
from pong.scritps.PongPlayer import PongPlayer
from utilities.GameManager import GameManager
from pong.scritps.ai import PongAI

class PongGameManager(GameManager):
	def __init__(self):
		"""
		Initialize the Pong game manager with a maximum of 2 players, ball, and score tracking.
		"""
		super().__init__(max_players=2)
		self.ball = Ball()
		self.scores = {"player1": 0, "player2": 0}
		self.update_lock = asyncio.Lock()

	def add_player(self, players_id: int, is_bot: bool):
		"""
		Initialize player with unique IDs and assign them to the game.

		:param players: A list of two unique player IDs.
		:raises ValueError: If there are not exactly two unique player IDs.
		"""
		if len(self.players) > 2:
			raise ValueError("Two unique player IDs are required to initialize players.")

		if is_bot:
			self.players[players_id] = PongAI(players_id, self.ball, constants.GAME_BOUNDS["xMax"] - 1, constants.PADDLE_COLOR)
		else:
			pos_x = constants.GAME_BOUNDS["xMin"] + 1
			if len(self.players) == 0:
				pos_x = constants.GAME_BOUNDS["xMax"] - 1

			self.players[players_id] = PongPlayer(
				player_id=players_id,
				x=pos_x,
				color=constants.PADDLE_COLOR,
			)

	def update_player(self, data: dict):
		"""
		Update player data based on the provided dictionary.

		:param data: Dictionary containing player update data.
		:raises KeyError: If the player ID is not found.
		"""
		try:
			player_id = data.get("playerId")
			if player_id not in self.players:
				raise KeyError(f"Player ID {player_id} not found.")

			self.players[player_id].update_player_data(data)
		except (KeyError, ValueError) as e:
			print(f"Error updating player data: {e}")


	def player_disconnected(self, player_id: int):
		"""
		Handle logic for when a player disconnects.

		:param player_id: The ID of the player to mark as disconnected.
		"""
		player = self.players.get(player_id)
		if player:
			player.status = PongPlayer.PlayerConnectionState.DISCONNECTED
			print(f"Player {player_id} marked as disconnected.")
		else:
			print(f"Error: Player ID {player_id} not found in players.")

	async def game_loop(self):
		"""
		Core game loop that updates the state of the players, ball, and handles collisions.
		"""
		async with self.update_lock:
			for player in self.players.values():
				player.player_loop()

			self.ball.update_position()

			for player in self.players.values():
				self.ball.handle_paddle_collision(player)

			out_of_bounds = self.ball.is_out_of_bounds()
			if out_of_bounds == "right":
				self.scores["player1"] += 1
				self.ball.reset()
			elif out_of_bounds == "left":
				self.scores["player2"] += 1
				self.ball.reset()

	def to_dict(self) -> dict:
		"""
		Convert the current game state to a dictionary.

		:return: Dictionary containing the game state, including players, ball, scores, and bounds.
		"""
		base_dict = super().to_dict()
		base_dict.update({
			"ball": self.ball.to_dict(),
			"scores": self.scores,
			"bounds": constants.GAME_BOUNDS,
		})
		return base_dict


