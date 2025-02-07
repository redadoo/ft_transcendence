from enum import Enum
from abc import ABC, abstractmethod


class Player(ABC):
	"""
	An abstract base class for representing a player in a game. 
	This class defines the interface and core functionality that all player types must implement.
	"""

	class PlayerConnectionState(Enum):
		"""
		Enum to represent the connection status of a player.
		"""
		CONNECTED = 0, "connected"
		DISCONNECTED = 1, "disconnected"

	def __init__(self, player_id: int):
		"""
		Initialize a player with a unique identifier and default connection status.

		:param player_id: A unique identifier for the player.
		"""
		self.player_id = player_id
		self.status = Player.PlayerConnectionState.CONNECTED

	@abstractmethod
	def update_player_data(self, data: dict):
		"""
		Update the player's data. Must be implemented by subclasses.

		:param data: A dictionary containing the updated player data.
		"""
		pass

	@abstractmethod
	def player_loop(self):
		"""
		The main loop for the player. Defines actions performed in each iteration of the game loop.
		Must be implemented by subclasses.
		"""
		pass

	def disconnect(self):
		"""
		Handles generic disconnection logic. Changes the player's connection status to DISCONNECTED.
		Subclasses can override this if additional behavior is needed.
		"""
		self.status = Player.PlayerConnectionState.DISCONNECTED

	@abstractmethod
	def player_disconnection(self):
		"""
		Abstract method for handling player-specific disconnection logic. 
		Must be implemented by subclasses.
		"""
		pass

	def to_dict(self) -> dict:
		"""
		Convert the player object to a dictionary for serialization.
		Must be implemented by subclasses.

		:return: A dictionary representing the player.
		"""
		return {
			"player_id": self.player_id,
			"player_connection_state": self.status.name,
		}
