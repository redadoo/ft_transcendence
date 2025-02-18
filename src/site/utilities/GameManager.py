from abc import ABC, abstractmethod
from utilities.Player import Player

class GameManager(ABC):
	"""
	An abstract base class for managing a game session, including players and game loop.
	"""

	def __init__(self, max_players: int):
		"""
		Initializes the GameManager instance with the specified maximum number of players and an empty player dictionary.

		Args:
			max_players (int): The maximum number of players allowed in the game.
		"""
		self.max_players: int = max_players
		self.players: dict[int, Player] = {}
		self.game_loop_is_active = False

	@abstractmethod
	def add_player(self, player_id: int):
		"""
		Adds a new player to the game. This method must be implemented by a subclass.

		Args:
			player_id (int): The unique identifier for the player being added.
		"""
		return

	@abstractmethod
	async def game_loop(self):
		"""
		The core game loop logic that is executed repeatedly during the game. Must be implemented by a subclass.
		"""
		return

	@abstractmethod
	def update_player(self, data: dict):
		"""
		Updates a player's data in the game. This method must be implemented by a subclass.

		Args:
			data (dict): A dictionary containing the player's updated information.
		"""
		return

	@abstractmethod
	def player_disconnected(self, player_id: int):
		"""
		Handles the logic when a player disconnects from the game. This method must be implemented by a subclass.

		Args:
			player_id (int): The identifier of the player who disconnected.
		"""
		return
	
	def players_to_dict(self) -> dict[str, any]:
		return {
			"players": {player_id: player.to_dict() for player_id, player in self.players.items()},
		}

	def to_dict(self) -> dict[str, any]:
		"""
		Converts the current state of the game manager to a dictionary format, including player information.

		Returns:
			dict: A dictionary representing the game manager state, including players and their data.
		"""
		return self.players_to_dict()
