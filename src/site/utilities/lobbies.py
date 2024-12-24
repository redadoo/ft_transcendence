from .lobby import Lobby
from utilities.GameManager import GameManager

class Lobbies:
	def __init__(self):
		self.lobbies = {}

	def create_lobby(self, room_name: str, game_manager: GameManager):
		if room_name not in self.lobbies:
			self.lobbies[room_name] = Lobby(room_name, game_manager)
		return self.lobbies[room_name]

	def get_lobby(self, room_name: str) -> Lobby:
		return self.lobbies.get(room_name, None)
	
	def remove_lobby(self, room_name: str):
		if room_name in self.lobbies:
			del self.lobbies[room_name]