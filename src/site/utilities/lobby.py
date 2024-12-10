from enum import Enum

class Lobby:

	class LobbyStatus(Enum):
		TO_SETUP = 0
		READY = 1
		PLAYING = 2
		ENDED = 3
		WAITING_PLAYER_RECONNECTION = 5

	def __init__(self, game_manager) -> None:
		self.players_id = []
		self.lobby_status = Lobby.LobbyStatus.TO_SETUP
		self.game_manager = game_manager

	def add_player(self, data):
		player_id = data.get("player_id") 
		if player_id == None:
			print(f"player_id is None when trying to get it from data")
			return
		
		if player_id not in self.players_id:
			self.players_id.append(player_id)
			if len(self.players_id) == self.game_manager.max_players:
				self.lobby_status = Lobby.LobbyStatus.READY
				self.game_manager.init_player(self.players_id)
		else:
			print(f"Player {player_id} already exists in lobby.")

	def remove_player(self, player_id):
		self.lobby_status = Lobby.LobbyStatus.WAITING_PLAYER_RECONNECTION
		self.game_manager.player_disconnected(player_id)

	def is_full(self):
		return len(self.players_id) == self.game_manager.max_players

	def to_dict(self):
		"""
		Converts the lobby to a dictionary.
		"""

		lobby_data =  {
			"current_lobby_status": self.lobby_status.name,
			"game_manager": self.game_manager.to_dict()
		}
		return lobby_data