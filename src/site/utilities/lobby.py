from enum import Enum

class Lobby:

	class LobbyStatus(Enum):
		TO_SETUP = 0
		WAITING_OTHER_PLAYER_CONNECTION = 1
		WAITING_PLAYER_RECONNECTION = 2
		PLAYING = 3
		ENDED = 4

	def __init__(self, game_manager) -> None:
		self.max_player = game_manager.max_player
		self.players = []
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.game_manager = game_manager

	def to_dict(self):
		"""
		Converts the lobby to a dictionary.
		"""

		lobby_data =  {
			"current_lobby_status": self.lobby_status.name,
			"game_manager": self.game_manager.to_dict()
		}
		return lobby_data