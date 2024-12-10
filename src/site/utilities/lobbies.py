from .lobby import Lobby

class Lobbies:
	def __init__(self):
		self.lobbies = {}
		self._lobbies = {}
	
	def create_lobby(self, room_name, lobby_data):
		if room_name not in self.lobbies:
			self.lobbies[room_name] = lobby_data
		return self.lobbies[room_name]
	
	def get_lobby(self, room_name):
		return self.lobbies.get(room_name, None)

	def remove_lobby(self, room_name):
		if room_name in self.lobbies:
			del self.lobbies[room_name]

	#v2
	def _create_lobby(self, room_name, game_manager):
		if room_name not in self.lobbies:
			self._lobbies[room_name] = Lobby(game_manager)
		return self._lobbies[room_name]

	def _join_lobby(self, player, lobby):
		try:
			lobby.game_manager.add_player(player)
		except:
			raise Exception(f"error when add player to lobby")
		
	def _get_lobby(self, room_name):
		return self._lobbies.get(room_name, None)
	
	def _remove_lobby(self, room_name):
		if room_name in self.lobbies:
			del self._lobbies[room_name]
	
