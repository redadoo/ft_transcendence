from asgiref.sync import sync_to_async
from django.db.models import Q
from website.models import Friendships, User
from channels.layers import get_channel_layer

class SocialUser:

	def __init__(self, user) -> None:
		self.user = user

	def get_name(self):
		return self.user.username
	
	async def notify_friends_status(self):

		friendships = await sync_to_async(list)(
			Friendships.objects.filter(
				Q(first_user__username=self.user.username) | Q(second_user__username=self.user.username)
			).select_related("first_user", "second_user")
		)

		channel_layer = get_channel_layer()
		for friendship in friendships:
			
			first_user = await sync_to_async(lambda: friendship.first_user)()
			second_user = await sync_to_async(lambda: friendship.second_user)()

			if first_user.username == self.user.username:
				actor = first_user
				recipient = second_user
			else:
				actor = second_user
				recipient = first_user

			payload = {
				"type": "friendship_status_change",
				"friend_username": actor.username,
				"status": User.get_status_name(actor.status),
			}

			await channel_layer.group_send(f"user_{recipient.id}", payload)
	
	async def change_status(self, data):
		"""
		Change the user's status if the new status is valid.

		Args:
			data (dict): Data containing the new status.

		Raises:
			ValueError: If the status is invalid.
		"""
		new_status = data.get("new_status")

		if not User.is_valid_status(new_status):
			raise ValueError(f"Invalid status: {new_status}")

		status_key = User.get_status_key(new_status)
		if status_key is None:
			raise ValueError(f"Invalid status: {new_status}")

		self.user.status = status_key
		await sync_to_async(self.user.save)(update_fields=["status"])
		print(f"Status updated for {self.user.username} to {new_status}")
		await self.notify_friends_status()
