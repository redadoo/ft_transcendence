import redis
import pickle
from .lobby import Lobby
from .Tournament import Tournament
from utilities.GameManager import GameManager
from django.conf import settings

class MatchManager:
	"""
	Manages a collection of game sessions (lobbies and tournaments).
	Allows for the creation, retrieval, and removal of matches using Redis.
	"""

	def __init__(self, redis_host='redis', redis_port=6379, redis_db=0):
		"""
		Initializes the MatchManager with a Redis connection.
		"""
		self.redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
	
	def _get_match_key(self, room_name: str) -> str:
		"""Helper function to get the Redis key for a match"""
		return f"match:{room_name}"

	def create_match(self, game_name: str, room_name: str, game_manager: GameManager, match_type: str):
			"""
			Creates a new match (Lobby or Tournament) with the given parameters.
			"""
			match_key = self._get_match_key(room_name)

			# Check if match already exists in Redis
			if not self.redis_client.exists(match_key):
				if match_type == "tournament":
					match = Tournament(game_name, room_name, game_manager, self)
				else:
					match = Lobby(game_name, room_name, game_manager, self)

				match_data = match.to_dict()
				self.redis_client.set(match_key, pickle.dumps(match_data))

				return match
			else:
				match_data = self.redis_client.get(match_key)
				match_dict = pickle.loads(match_data)
				if match_type == "tournament":
					match = Tournament.from_dict(match_dict, game_manager, self)  
				else:
					match = Lobby.from_dict(match_dict, game_manager, self)
				return match

	def get_match(self, room_name: str):
		"""
		Retrieves the match (Lobby or Tournament) associated with the given room name.
		"""
		match_key = self._get_match_key(room_name)
		match_data = self.redis_client.get(match_key)
		if not match_data:
			return None
		match_dict = pickle.loads(match_data)
		return match_dict

	def remove_match(self, room_name: str):
		"""
		Removes the match (Lobby or Tournament) associated with the given room name from Redis.

		Args:
			room_name (str): The name of the match room to remove.
		"""
		match_key = self._get_match_key(room_name)

		if self.redis_client.exists(match_key):
			self.redis_client.delete(match_key)
			print(f"Match room '{room_name}' was removed from Redis.", flush=True)
		else:
			print(f"Match room '{room_name}' not found in Redis.", flush=True)
