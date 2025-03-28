from channels.db import database_sync_to_async
from django.db.models import Q
from website.models import Friendships, User
from channels.layers import get_channel_layer
from social.models import ChatMessage
from django.utils.html import escape

MAX_MESSAGE_LENGTH = 500

class SocialUser:

	def __init__(self, user):
		self.user = user
		self.channel_layer = get_channel_layer()

	async def _validate_user(self, username):
		if username == self.user.username:
			raise ValueError("Cannot perform this operation on yourself.")
		try:
			return await database_sync_to_async(User.objects.get)(username=username)
		except User.DoesNotExist:
			raise ValueError(f"User '{username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")
	async def _get_friendship(self, target_user):
		try:
			friendship = await database_sync_to_async(Friendships.objects.get)(
				Q(first_user=self.user, second_user=target_user) |
				Q(first_user=target_user, second_user=self.user)
			)
		except Friendships.DoesNotExist:
			raise ValueError(f"a relationship between '{self.user.username}' and '{target_user.username}' does not exist")
		except Exception as e:
			raise ValueError(f"error while getting friendships: {str(e)}")
		return friendship

	async def notify_friends_status(self):
		try:
			friendships = await database_sync_to_async(list)(
				Friendships.objects.filter(
					Q(first_user=self.user) | Q(second_user=self.user)
				).select_related("first_user", "second_user")
			)
		except Exception as e:
			raise ValueError(f"error while getting friendships: {str(e)}")

		notifications = []
		for friendship in friendships:
			
			if friendship.status != Friendships.FriendshipsStatus.FRIENDS:
				continue
			
			actor = self.user
			recipient = friendship.second_user if friendship.first_user == self.user else friendship.first_user

			payload = {
				"type": "get_status_change",
				"friend_username": actor.username,
				"status": User.get_status_name(actor.status),
			}
			notifications.append((f"user_{recipient.id}", payload))

		for group, payload in notifications:
			await self.channel_layer.group_send(group, payload)

	async def notify_friend_status(self, friend_user):
		try:
			friendship = await database_sync_to_async(
				Friendships.objects.filter(
					(Q(first_user=self.user, second_user=friend_user) | Q(first_user=friend_user, second_user=self.user))
					& Q(status=Friendships.FriendshipsStatus.FRIENDS)
				).select_related("first_user", "second_user").first
			)()
			
			if not friendship:
				return

		except Exception as e:
			raise ValueError(f"error while getting friendship: {str(e)}")

		actor = self.user
		recipient = friend_user

		payload = {
			"type": "get_status_change",
			"friend_username": actor.username,
			"status": User.get_status_name(actor.status),
		}

		await self.channel_layer.group_send(f"user_{recipient.id}", payload)

	async def change_status(self, data: dict):
		"""
		Block a user, preventing further interaction.

		Args:
			data (dict): Data containing the username of the user to block.

		Raises:
			ValueError: If the username is not provided, the user doesn't exist, or there is no existing friendship.
		"""
		new_status = data.get("new_status")
		
		try:

			if new_status is None:
				raise ValueError(f"bad dict cant retrieve new_status")

			if not User.is_valid_status(new_status):
				raise ValueError(f"Invalid status: {new_status}")

			status_key = User.get_status_key(new_status)
			if status_key is None:
				raise ValueError(f"Invalid status: {new_status}")

			self.user.status = status_key
		
		except Exception as e:
			print(f" error change status {e}")
			return
		
		try:
			await database_sync_to_async(self.user.save)(update_fields=["status"])
		except Exception as e:
			raise ValueError(f"error while saving new status: {str(e)}")
		await self.notify_friends_status()

	async def block_user(self, data: dict):
		"""
		Unblock a user, allowing interaction again.

		Args:
		data (dict): Data containing the username of the user to unblock.

		Raises:
		ValueError: If the username is not provided, the user doesn't exist, or there is no existing block relationship.
		"""
		user_to_block = await self._validate_user(data.get("username"))
		friendship = await self._get_friendship(user_to_block)

		if friendship.status != Friendships.FriendshipsStatus.FRIENDS:
			print(f"User '{user_to_block}' isnt friend with '{self.user.username}'.")
			return

		try:
			block_target = await database_sync_to_async(User.objects.get)(username=user_to_block)
			first_user = await database_sync_to_async(lambda: friendship.first_user)()
			if first_user.username == self.user.username:
				friendship.status = Friendships.FriendshipsStatus.FIRST_USER_BLOCK
			else:
				friendship.status = Friendships.FriendshipsStatus.SECOND_USER_BLOCK
			await database_sync_to_async(friendship.save)(update_fields=["status"])
		except User.DoesNotExist:
			raise ValueError(f"User '{user_to_block}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while getting user to block: {str(e)}")

		payload = {
			"type": "get_blocked",
			"username": self.user.username,
		}
		await self.channel_layer.group_send(f"user_{block_target.id}", payload)

	async def unblock_user(self, data: dict):
		"""
		Block a user, preventing further interaction.

		Args:
			data (dict): Data containing the username of the user to block.

		Raises:
			ValueError: If the username is not provided or the user doesn't exist.
		"""
		user_to_unblock = await self._validate_user(data.get("username"))
		friendship =  await self._get_friendship(user_to_unblock)
		
		if friendship.status != Friendships.FriendshipsStatus.FIRST_USER_BLOCK and friendship.status != Friendships.FriendshipsStatus.SECOND_USER_BLOCK:
			raise ValueError(f"User '{user_to_unblock}' is not blocked.")

		try:
			unblock_target = await database_sync_to_async(User.objects.get)(username=user_to_unblock)
			friendship.status = Friendships.FriendshipsStatus.FRIENDS
			await database_sync_to_async(friendship.save)(update_fields=["status"])
		except User.DoesNotExist:
			raise ValueError(f"User '{user_to_unblock}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while getting user: {str(e)}")

		payload = {
			"type": "get_unblocked",
			"username": self.user.username,
		}

		await self.channel_layer.group_send(f"user_{unblock_target.id}", payload)

	async def send_friend_request(self, data: dict):
		target_username = await self._validate_user(data.get("username"))

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
			existing_friendship = await database_sync_to_async(
				lambda: Friendships.objects.filter(
					Q(first_user=self.user, second_user=target_user) |
					Q(first_user=target_user, second_user=self.user)
				).exists()
			)()

			if existing_friendship:
				print(f"A friendship or pending request already exists with '{target_username}'.")
				return 

			await database_sync_to_async(Friendships.objects.create)(
				first_user=self.user,
				second_user=target_user,
				status=Friendships.FriendshipsStatus.PENDING
			)
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while sending frined request: {str(e)}")


		payload = {
			"type": "get_friend_request",
			"username": self.user.username,
		}

		await self.channel_layer.group_send(f"user_{target_user.id}", payload)

	async def remove_friend(self, data: dict, event_name: str):
		"""
		Remove a friend, deleting the friendship relationship.

		Args:
			data (dict): Data containing the username of the friend to remove.

		Raises:
			ValueError: If the username is not provided, the user doesn't exist, or no friendship exists.
		"""

		target_username = await self._validate_user(data.get("username"))
		friendship =  await self._get_friendship(target_username)

		if friendship is None:
			print(f"Friendship with user '{target_username}' and '{self.user.username}' dont exist.")
			return

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
			await database_sync_to_async(friendship.delete)()
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")

		payload = {
			"type": event_name,
			"username": self.user.username,
		}

		await self.channel_layer.group_send(f"user_{target_user.id}", payload)

	async def accept_friend_request(self, data: dict):
		target_username = await self._validate_user(data.get("username"))
		friendship =  await self._get_friendship(target_username)

		if friendship.status != Friendships.FriendshipsStatus.PENDING:
			raise ValueError(f"Friendship status with user '{target_username}' and '{self.user.username}'isnt Pending.")

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
			friendship.status = Friendships.FriendshipsStatus.FRIENDS
			await database_sync_to_async(friendship.save)(update_fields=["status"])
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")

		payload = {
			"type": "get_friend_request_accepted",
			"username": self.user.username,
		}

		await self.channel_layer.group_send(f"user_{target_user.id}", payload)

		await self.notify_friend_status(target_user)

	async def send_message(self, data: dict):
		target_username = await self._validate_user(data.get("username"))

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")
				
		_friendship =  await self._get_friendship(target_username)

		if _friendship.status != Friendships.FriendshipsStatus.FRIENDS:
			print(f"User '{target_username}' isnt friend with {self.user.username}.")
			return

		message: str = data.get("message")

		if message is None:
			raise ValueError("Invalid data: 'message' is required.")

		message = escape(message)

		if len(message) > MAX_MESSAGE_LENGTH:
			raise ValueError("Message is too long.")

		try:
			await database_sync_to_async(ChatMessage.objects.create)(
				friendship=_friendship,
				sender=self.user,
				message_text=message
			)
		except Exception as e:
			raise ValueError(f"error while creating chat: {str(e)}")

		payload = {
			"type": "get_message",
			"message": message,
			"username": self.user.username,
		}
		await self.channel_layer.group_send(f"user_{target_user.id}", payload)

	async def send_lobby_invite(self, data: dict):
		target_username = await self._validate_user(data.get("username"))

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")
		payload = {
			"type": "get_lobby_invite",
			"room_name": data.get("room_name"),
			"username": self.user.username 
		}

		await self.channel_layer.group_send(f"user_{target_user.id}", payload)

	async def send_tournament_invite(self, data: dict):
		target_username = await self._validate_user(data.get("username"))

		try:
			target_user = await database_sync_to_async(User.objects.get)(username=target_username)
		except User.DoesNotExist:
			raise ValueError(f"User '{target_username}' does not exist.")
		except Exception as e:
			raise ValueError(f"error while retrieving user: {str(e)}")
		payload = {
			"type": "get_tournament_invite",
			"room_name": data.get("room_name"),
			"username": self.user.username
		}

		await self.channel_layer.group_send(f"user_{target_user.id}", payload)