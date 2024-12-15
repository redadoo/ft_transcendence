from asgiref.sync import sync_to_async
from django.db.models import Q
from website.models import Friendships, User
from channels.layers import get_channel_layer

class SocialUser:

	def __init__(self, user) -> None:
		self.user = user

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
	
	async def change_status(self, data: dict):
		"""
		Change the user's status if the new status is valid.

		Args:
			data (dict): Data containing the new status.

		Raises:
			ValueError: If the status is invalid.
		"""
		new_status = data.get("new_status")

		if new_status is None:
			raise ValueError(f"bad dict cant retrieve new_status")

		if not User.is_valid_status(new_status):
			raise ValueError(f"Invalid status: {new_status}")

		status_key = User.get_status_key(new_status)
		if status_key is None:
			raise ValueError(f"Invalid status: {new_status}")

		self.user.status = status_key
		await sync_to_async(self.user.save)(update_fields=["status"])
		await self.notify_friends_status()

	async def block_user(self, data: dict):
		"""
		Block a user, preventing further interaction.

		Args:
			data (dict): Data containing the username of the user to block.

		Raises:
			ValueError: If the username is not provided or the user doesn't exist.
		"""

		user_to_block = data.get("username")

		if user_to_block is None:
			raise ValueError(f"bad dict cant retrieve user_to_block")
		
		try:
			block_target = await sync_to_async(User.objects.get)(username=user_to_block)
		except User.DoesNotExist:
			raise ValueError(f"User '{user_to_block}' does not exist.")
		

		friendship, created = await sync_to_async(Friendships.objects.get_or_create)(
			first_user=min(self.user, block_target, key=lambda u: u.id),
			second_user=max(self.user, block_target, key=lambda u: u.id),
			defaults={"status": Friendships.FriendshipsStatus.BLOCK},
		)

		if not created:
			friendship.status = (
				Friendships.FriendshipsStatus.FIRST_USER_BLOCK
				if friendship.first_user == self.user
				else Friendships.FriendshipsStatus.SECOND_USER_BLOCK
			)
			await sync_to_async(friendship.save)()

		channel_layer = get_channel_layer()
		payload = {
			"type": "friendship_status_change",
			"friend_username": self.user.username,
			"status": "Blocked",
		}
		await channel_layer.group_send(f"user_{block_target.id}", payload)
