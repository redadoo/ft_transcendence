import json
from channels.generic.websocket import AsyncWebsocketConsumer
from social.scripts.SocialUser import SocialUser
from channels.layers import get_channel_layer
from website.models import User
from channels.db import database_sync_to_async

async def get_active_users():
	"""Fetch active users asynchronously (Online, Away, Busy, Matchmaking, Playing)."""
	active_statuses = [
		User.UserStatus.ONLINE,
		User.UserStatus.AWAY,
		User.UserStatus.BUSY,
		User.UserStatus.MATCHMAKING,
		User.UserStatus.PLAYING,
	]
	return await database_sync_to_async(lambda: list(User.objects.filter(status__in=active_statuses).values_list('id', flat=True)))()

async def send_event_to_all_consumer(event_type: str, message: dict):
	"""Send a WebSocket event to all active users."""
	channel_layer = get_channel_layer()
	try:
		active_user_ids = await get_active_users()
	except Exception as e:
		raise ValueError(f"error while retrieving user: {str(e)}")
	for user_id in active_user_ids:
		group_name = f"user_{user_id}"
		payload = {"type": event_type, **message}

		try:
			await channel_layer.group_send(group_name, payload)
		except Exception as e:
			print(f"Failed to send event to {group_name}: {e}")

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


		self.event_mapping = {
			"status_change": self.user.change_status,
			"block_user": self.user.block_user,
			"unblock_user": self.user.unblock_user,
			"friend_request": self.user.send_friend_request,
			"remove_friend": lambda d: self.user.remove_friend(d, "get_friend_removed"),
			"friend_request_declined": lambda d: self.user.remove_friend(d, "get_friend_request_declined"),
			"friend_request_accepted": self.user.accept_friend_request,
			"send_message": self.user.send_message,
			"send_lobby_invite": self.user.send_lobby_invite,
			"user_join_lobby": self.user_join_lobby,
			"send_tournament_invite": self.user.send_tournament_invite,
		}

	async def disconnect(self, close_code):
		"""
		Remove the user from the channel group when they disconnect.
		"""
		await self.user.change_status({"new_status": "Offline"})
		await self.channel_layer.group_discard(self.group_name, self.channel_name)

	async def receive(self, text_data: str):
		"""
		Process incoming WebSocket messages.
		"""
		try:
			data = json.loads(text_data)
		except json.JSONDecodeError as e:
			print(f"Invalid JSON received: {e}")
			return

		event_type = data.get("type")
		handler = self.event_mapping.get(event_type, self.handle_unhandled_event)
		await handler(data)

	async def handle_unhandled_event(self, data):
		event_type = data.get("type")
		print(f"Unhandled event type: {event_type}")
		
	async def send_event(self, event_type: str, **kwargs):
		"""
		Generic method to send events to the WebSocket.
		"""
		payload = {"type": event_type, **kwargs}
		await self.send(text_data=json.dumps(payload))

	async def get_update_users(self, event: dict):
		await self.send_event("get_update_users", username=event["username"])

	async def get_status_change(self, event: dict):
		await self.send_event("get_status_change", friend_username=event["friend_username"], new_status=event["status"])

	async def get_blocked(self, event: dict):
		await self.send_event("get_blocked", username=event["username"])

	async def get_unblocked(self, event: dict):
		await self.send_event("get_unblocked", username=event["username"])

	async def get_friend_request(self, event: dict):
		await self.send_event("get_friend_request", username=event["username"])

	async def get_friend_request_declined(self, event: dict):
		await self.send_event("get_friend_request_declined", username=event["username"])

	async def get_friend_removed(self, event: dict):
		await self.send_event("get_friend_removed", username=event["username"])

	async def get_friend_request_accepted(self, event: dict):
		await self.user.notify_friends_status()
		await self.send_event("get_friend_request_accepted", username=event["username"])

	async def get_message(self, event: dict):
		await self.send_event("get_message", username=event["username"], message=event["message"])

	async def send_pong_lobby(self, event):
		self.lobby_room_name = event["room_name"]
		await self.send_event("get_lobby_room_name", lobby_room_name=self.lobby_room_name)

	async def get_lobby_invite(self, event):
		await self.send_event("get_lobby_invite", room_name=event["room_name"], username=event["username"])

	async def user_join_lobby(self, event):
		await self.send_event("get_player_joined", username=event["username"])

	async def send_pong_tournament(self, event):
		self.lobby_room_name = event["room_name"]
		await self.send_event("get_tournament_room_name", lobby_room_name=self.lobby_room_name)

	async def get_tournament_invite(self, event):
		await self.send_event("get_tournament_invite", room_name=event["room_name"], username=event["username"])

	async def user_join_tournament(self, event):
		await self.send_event("get_tournament_player_joined", players=event["players"])