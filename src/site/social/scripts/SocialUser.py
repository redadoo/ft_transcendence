from website.models import User
from asgiref.sync import sync_to_async


from asgiref.sync import async_to_sync
from django.db.models import Q
from website.models import Friendships, User

class SocialUser:

	def __init__(self, user) -> None:
		self.user = user

	async def get_friends(self):
		friends = await sync_to_async(list)(
			Friendships.objects.filter(
				Q(first_user__username=self.user.username) | Q(second_user__username=self.user.username)
			)
		)
		return friends
		

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

		if self.user.status != status_key:
			self.user.status = status_key
			await sync_to_async(self.user.save)(update_fields=["status"])
			print(f"Status updated for {self.user.username} to {new_status}")
		else:
			print(f"Status for {self.user.username} is already '{new_status}'")

	def to_dict(self):
		return {}