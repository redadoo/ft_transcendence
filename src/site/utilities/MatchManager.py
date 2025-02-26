from .lobby import Lobby
from .Tournament import Tournament
from utilities.GameManager import GameManager

class MatchManager:
	"""
	Manages a collection of game sessions, including lobbies and tournaments.
	Allows for the creation, retrieval, and removal of matches.
	"""

	def __init__(self):
		"""
		Initializes the MatchManager instance with an empty dictionary to store matches.
		"""
		self.matches = {}

	def create_match(self, game_name: str, room_name: str, game_manager: GameManager, match_type: str):
		"""
		Creates a new match (Lobby or Tournament) with the given parameters.

		Args:
			game_name (str): The name of the game for the match.
			room_name (str): The name of the match room.
			game_manager (GameManager): The game manager instance.
			match_type (str): The type of match ('lobby' or 'tournament').

		Returns:
			Lobby or Tournament: The created or retrieved match instance.
		"""
		if room_name not in self.matches:
			if match_type == "tournament":
				self.matches[room_name] = Tournament(game_name, room_name, game_manager,  self)
			else:
				self.matches[room_name] = Lobby(game_name, room_name, game_manager, self)
		return self.matches[room_name]

	def get_match(self, room_name: str):
		"""
		Retrieves the match (Lobby or Tournament) associated with the given room name.

		Args:
			room_name (str): The name of the match room to retrieve.

		Returns:
			Lobby or Tournament or None: The match instance if found, otherwise None.
		"""
		return self.matches.get(room_name, None)

	def remove_match(self, room_name: str):
		"""
		Removes the match (Lobby or Tournament) associated with the given room name.

		Args:
			room_name (str): The name of the match room to remove.
		"""
		removed_match = self.matches.pop(room_name, None)
		if removed_match is None:
			print(f"Match room '{room_name}' not found.")
