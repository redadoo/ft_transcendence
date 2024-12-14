from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from django.dispatch import receiver
from django.db.models.signals import post_save
from .models import Friendships, User

@receiver(post_save, sender=User)
def notify_friend_status_change(sender, instance, **kwargs):
	"""
	Notify friends of user whose status has changed.
	"""

	print("si valetto")

	# Get the channel layer
	channel_layer = get_channel_layer()

	friends = Friendships.objects.filter(
		Q(first_user=instance) | Q(second_user=instance)
	)


	for friendship in friends:
		actor = friendship.first_user if friendship.second_user == instance else friendship.second_user
		recipient = friendship.second_user if friendship.first_user == instance else friendship.first_user
		
		payload = {
			'type': 'friendship_status_change',
			'data': {
				'id': instance.id,
				'friend_username': actor.username,
				'status': instance.get_status_display(),
			},
		}
		
		async_to_sync(channel_layer.group_send)(
			f"user_{recipient.id}",
			payload
		)