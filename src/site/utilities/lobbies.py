class Lobbies:
	def __init__(self):
		self.lobbies = {}

	def create_lobby(self, room_name, lobby_data):
		if room_name not in self.lobbies:
			self.lobbies[room_name] = lobby_data
		return self.lobbies[room_name]

	def get_lobby(self, room_name):
		return self.lobbies.get(room_name, None)

	def remove_lobby(self, room_name):
		if room_name in self.lobbies:
			del self.lobbies[room_name]
