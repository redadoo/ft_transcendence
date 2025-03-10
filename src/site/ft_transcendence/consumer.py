import json

from autobahn.websocket.protocol import Disconnected
from channels.generic.websocket import AsyncWebsocketConsumer

class BaseConsumer(AsyncWebsocketConsumer):
	"""
	Base consumer that provides common functionality for joining/leaving groups,
	sending messages safely, and parsing incoming JSON.
	"""
	async def join_group(self, group_name: str):
		await self.channel_layer.group_add(group_name, self.channel_name)

	async def leave_group(self, group_name: str):
		await self.channel_layer.group_discard(group_name, self.channel_name)

	async def safe_send(self, data: dict):
		try:
			await self.send(text_data=json.dumps(data))
		except Disconnected:
			print(f"Attempted to send on closed connection. Data: {data}")

	async def parse_json(self, text_data: str) -> dict:
		try:
			return json.loads(text_data)
		except json.JSONDecodeError as e:
			print(f"Error decoding JSON: {e}")
			return {}
	
	async def receive(self, text_data: str):
		data = await self.parse_json(text_data)
		if data.get("type") == "ping":
			await self.safe_send({'type': 'pong', 'time': data.get('time')})
			return
		await self.handle_event(data)

	async def handle_event(self, data: dict):
		"""
		This method should be overridden in each subclass to handle
		consumer-specific events.
		"""
		pass

	async def send_to_social(self, data: dict):
		if hasattr(self, "user_id"):
			await self.channel_layer.group_send(f"user_{self.user_id}", data)

	async def lobby_state(self, event: dict):
		"""
		Sends updated state information to the client.
		Falls back to self.lobby.to_dict() if no snapshot is provided.
		"""
		snapshot_key = "lobby_snapshot" if "lobby_snapshot" in event else "tournament_snapshot"
		state_info = event.get(snapshot_key) or (self.lobby.to_dict() if self.lobby else {})
		data_to_send = {
			"event_info": event,
			"lobby_info": state_info,
		}
		await self.safe_send(data_to_send)