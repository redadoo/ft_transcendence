import json
from channels.generic.websocket import AsyncWebsocketConsumer
from social.scripts.SocialUser import SocialUser

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

	async def receive(self, text_data: dict):
		data = json.loads(text_data)
		event_type = data.get("type")
		match event_type:
			case "status_change":
				await self.user.change_status(data)
			case "block_user":
				await self.user.block_user(data)
			case "unblock_user":
				await self.user.unblock_user(data)
			case "friend_request":
				await self.user.send_friend_request(data)
			case "remove_friend":
				await self.user.remove_friend(data,"get_friend_removed")
			case "friend_request_declined":
				await self.user.remove_friend(data,"get_friend_request_declined")
			case "friend_request_accepted":
				await self.user.accept_friend_request(data)
			case "send_message":
				await self.user.send_message(data)
			case _:
				print(f"Unhandled event type: {event_type}")

	async def get_status_change(self, event: dict):
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

	async def get_blocked(self, event: dict):
		"""
		Receive a friendship status change event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_blocked",
				"username" : event["username"]
			})
		)

	async def get_unblocked(self, event: dict):
		"""
		Receive a friendship status change event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_unblocked",
				"username" : event["username"]
			})
		)

	async def get_friend_request(self, event: dict):
		"""
		Receive a friend request event.
		"""

		await self.send(
			text_data=json.dumps({
				"type": "get_friend_request",
				"username" : event["username"]
			})
		)

	async def get_friend_request_declined(self, event: dict):
		await self.send(
			text_data=json.dumps({
				"type": "get_friend_request_declined",
				"username" : event["username"]
			})
		)

	async def get_friend_removed(self, event: dict):
		await self.send(
			text_data=json.dumps({
				"type": "get_friend_removed",
				"username" : event["username"]
			})
		)

	async def get_friend_request_accepted(self, event: dict):
		await self.send(
			text_data=json.dumps({
				"type": "get_friend_request_accepted",
				"username" : event["username"]
			})
		)

	async def get_message(self, event: dict):
		await self.send(
			text_data=json.dumps({
				"type": "get_message",
				"username" : event["username"]
			})
		)