import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Add the user to a channel group when they connect.
		"""
		self.user_id = self.scope['user'].id  # Assuming authentication is set up
		self.group_name = f"user_{self.user_id}"
		
		# Add the user to the group
		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()
	
	async def disconnect(self, close_code):
		"""
		Remove the user from the channel group when they disconnect.
		"""
		await self.channel_layer.group_discard(self.group_name, self.channel_name)

	async def friendship_status_change(self, event):
		"""
		Receive a friendship status change event.
		"""
		# Send the event data to the WebSocket
		await self.send(text_data=json.dumps(event['data']))
