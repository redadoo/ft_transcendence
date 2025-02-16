from django.core.management.base import BaseCommand
from website.models import User, UserStats, UserImage

class Command(BaseCommand):
	help = 'Create the bot user with id=-1 if it doesn\'t exist.'

	def handle(self, *args, **kwargs):
		if not User.objects.filter(id=-1).exists():
			bot_user = User.objects.create(id=-1, username="bot", email="bot@example.com", status=User.UserStatus.ONLINE)
			bot_user.set_password("bot")
			bot_user.save()
			UserStats.objects.create(user=bot_user)
			UserImage.objects.create(user=bot_user)
			self.stdout.write(self.style.SUCCESS("Successfully created bot user with id=-1"))
		else:
			self.stdout.write(self.style.SUCCESS("Bot user already exists"))
