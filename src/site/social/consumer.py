import json
from channels.generic.websocket import AsyncWebsocketConsumer
from social.scripts.SocialUser import SocialUser
from asgiref.sync import sync_to_async
from website.models import User

class SocialConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Add the user to a channel group when they connect.
		"""
		self.group_name = f"user_{self.scope['user'].id}"
		self.user = SocialUser(self.scope["user"])

		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()
		await self.user.change_status({"new_status": "Online"})

	async def disconnect(self, close_code):
		"""
		Remove the user from the channel group when they disconnect.
		"""
		await self.user.change_status({"new_status": "Offline"})
		await self.channel_layer.group_discard(self.group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		event_type = data.get("type")
		match event_type:
			case "status_change":
				await self.user.change_status(data)
			case "block_user":
				await self.user.block_user(data)
			case "unblock_user":
				await self.user.unblock_user(data)
			case "send_friend_request":
				pass
			case "remove_friend":
				pass
			case "get_users_list":
				pass
			case "get_chat":
				pass
			case "send_messagge":
				pass
			case "send_tournament_invite":
				pass
			case _:
				print(f"Unhandled event type: {event_type}")

	async def get_status_change(self, event):
		"""
		Receive a friendship status change event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_status_change",
				"friend_username" : event["friend_username"],
				"new_status" : event["status"]
			})
		)

	async def get_blocked(self, event):
		"""
		Receive a friendship status change event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_blocked",
				"username" : event["username"]
			})
		)

	async def get_unblocked(self, event):
		"""
		Receive a friendship status change event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_unblocked",
				"username" : event["username"]
			})
		)
