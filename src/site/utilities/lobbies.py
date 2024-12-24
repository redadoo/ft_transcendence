from .lobby import Lobby
from utilities.GameManager import GameManager

class Lobbies:
	"""
    Manages a collection of game lobbies. Allows for the creation, retrieval, and removal of lobbies.
    """

	def __init__(self):
		"""
        Initializes the Lobbies instance with an empty dictionary to store lobbies.
        """
		self.lobbies = {}

	def create_lobby(self, room_name: str, game_manager: GameManager):
		"""
        Creates a new lobby with the given room name and GameManager instance, if it doesn't already exist.

        Args:
            room_name (str): The name of the room to create.
            game_manager (GameManager): The GameManager instance associated with the lobby.

        Returns:
            Lobby: The created or retrieved Lobby instance.
        """
		if room_name not in self.lobbies:
			self.lobbies[room_name] = Lobby(room_name, game_manager)
		return self.lobbies[room_name]

	def get_lobby(self, room_name: str) -> Lobby:
		"""
        Retrieves the lobby associated with the given room name.

        Args:
            room_name (str): The name of the room to retrieve.

        Returns:
            Lobby or None: The Lobby instance if found, otherwise None.
        """
		return self.lobbies.get(room_name, None)
	
	def remove_lobby(self, room_name: str):
		"""
		Removes the lobby associated with the given room name.

		Args:
			room_name (str): The name of the room to remove.
		"""
		if room_name in self.lobbies:
			del self.lobbies[room_name]