import json
import uuid

from website.models import User
from utilities.lobby import Lobby
from asgiref.sync import sync_to_async
from utilities.Tournament import Tournament
from utilities.MatchManager import MatchManager
from pong.scripts.PongGameManager import PongGameManager
from channels.generic.websocket import AsyncWebsocketConsumer

match_manager = MatchManager()

class PongMatchmaking(AsyncWebsocketConsumer):
	matchmaking_queue = []
	room_group_name = "pong_matchmaking"
	
	async def connect(self):
		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
		if self.channel_name in self.matchmaking_queue:
			self.matchmaking_queue.remove(self.channel_name)

	async def receive(self, text_data):
		request = json.loads(text_data)
		if request.get("action") == "join_matchmaking":
			self.matchmaking_queue.append(self.channel_name)
			await self.check_for_match()

	async def check_for_match(self):
		while len(self.matchmaking_queue) >= 2:
			player1 = self.matchmaking_queue.pop(0)
			player2 = self.matchmaking_queue.pop(0)

			room_name = str(uuid.uuid4())

			await self.channel_layer.send(
				player1,
				{
					"type": "send.match.found",
					"room_name": room_name,
				}
			)
			await self.channel_layer.send(
				player2,
				{
					"type": "send.match.found",
					"room_name": room_name,
				}
			)

	async def send_match_found(self, event):
		room_name = event["room_name"]
		await self.send(text_data=json.dumps({
			"type": "setup_pong_lobby", 
			"room_name": room_name
			}))

class PongMultiplayerConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.user_id = self.scope["user"].id
		
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.lobby = match_manager.get_match(self.room_name)
		if self.lobby == None:
			self.lobby = match_manager.create_match("pong", self.room_name,  PongGameManager(), "lobby")

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()
		
		#send room_name to social consumer to send lobby invites
		await self.channel_layer.group_send(
			f"user_{self.user_id}",  
			{
				"type": "send_pong_lobby",
				"room_name": self.room_name,
			}
		)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		data_to_send = {
			"event_info": event,
			"lobby_info": self.lobby.to_dict()
		}
		await self.send(text_data=json.dumps(data_to_send))

class PongSingleplayerConsumer(AsyncWebsocketConsumer):

	def generate_random_room_name(self) -> str:
		room_name_dict = self.scope["url_route"]["kwargs"]
		room_name_components = [str(value) for value in room_name_dict.values()]
		room_name_components.append(str(uuid.uuid4()))
		return "_".join(room_name_components)

	async def connect(self):
		self.room_name = self.generate_random_room_name()
		self.lobby: Lobby = match_manager.create_match("pong", self.room_name,  PongGameManager(), "Lobby")

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.lobby.broadcast_message({"type": "lobby_state"})
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)
		if data.get("type") == "init_player":
			await self.lobby.add_player_to_lobby({"player_id" : "-1"}, True)
			await self.lobby.start_game()

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		data_to_send = {
			"event_info": event,
			"lobby_info": self.lobby.to_dict()
		}
		await self.send(text_data=json.dumps(data_to_send))

class PongLobbyConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.user_id = self.scope["user"].id
		
		self.room_name = self.scope["url_route"]["kwargs"].get("room_name", None)

		if self.room_name is None:
			self.room_name = str(uuid.uuid4())
		
			#send room_name to social consumer to send lobby invites
			await self.channel_layer.group_send(
				f"user_{self.user_id}",  
				{
					"type": "send_pong_lobby",
					"room_name": self.room_name,
				}
			)
		self.lobby = match_manager.get_match(self.room_name)
		if self.lobby == None:
			self.lobby = match_manager.create_match("pong", self.room_name,  PongGameManager(), "lobby")

		await self.channel_layer.group_add(self.lobby.room_group_name, self.channel_name)
		await self.accept()
		
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.lobby.room_group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await self.lobby.manage_event(data)

	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		data_to_send = {
			"event_info": event,
			"lobby_info": self.lobby.to_dict()
		}

		event_name: str = event.get("event_name", None) 
		player_id: str = event.get("player_id", None) 
		
		if event_name == 'player_join' and player_id is not None:

			username = await sync_to_async(User.objects.get)(id=int(player_id))
			
			await self.channel_layer.group_send(
				f"user_{self.user_id}",  
				{
					"type": "user_join_Lobby",
					"player_id": username,
				}
			)
			
		await self.send(text_data=json.dumps(data_to_send))

class PongTournament(AsyncWebsocketConsumer):

	async def connect(self):
		self.tournament = Tournament()

		await self.channel_layer.group_add(self.tournament.room_group_name, self.channel_name)
		await self.accept()
	
	async def lobby_state(self, event: dict):
		"""Aggiorna lo stato lato client."""

		data_to_send = {
			"event_info": event,
			"lobby_info": self.tournament.to_dict()
		}
		await self.send(text_data=json.dumps(data_to_send))