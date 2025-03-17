from utilities.lobby import Lobby
from utilities.Tournament import Tournament
from utilities.GameManager import GameManager


class MatchManager:
	"""
	Manages a collection of game sessions (lobbies and tournaments).
	Allows for the creation, retrieval, and removal of matches.
	"""
	
	def __init__(self):
		self.matches = {}
	
	def create_match(self, game_name: str, room_name: str, game_manager: GameManager, match_type: str):
		"""
		Creates a new match (Lobby or Tournament) with the given parameters.
		
		Args:
			game_name (str): The name of the game.
			room_name (str): The name of the room.
			game_manager (GameManager): The game manager instance.
			match_type (str): The type of match ('tournament' or 'lobby').
		
		Returns:
			Lobby or Tournament: The created match instance.
		"""
		if room_name in self.matches:
			return self.matches[room_name]
		
		match = Tournament(game_name, room_name, game_manager) if match_type == "tournament" else Lobby(game_name, room_name, game_manager)
		self.matches[room_name] = match
		return match
	
	def get_match(self, room_name: str):
		"""
		Retrieves a match by room name.
		
		Args:
			room_name (str): The name of the room.
		
		Returns:
			Lobby or Tournament or None: The match instance if found, else None.
		"""
		return self.matches.get(room_name, None)
	
	def remove_match(self, room_name: str):
		"""
		Removes the match associated with the given room name.
		
		Args:
			room_name (str): The name of the match room to remove.
		"""
		if room_name in self.matches:
			print(f"Room '{room_name}' deleted.")
			del self.matches[room_name]
		else:
			print(f"Room '{room_name}' not found.")
