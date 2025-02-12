from django.core.management.base import BaseCommand, CommandError
from website.models import User

class Command(BaseCommand):
    help = 'Create the bot user with id=-1 if it doesn\'t exist.'

    def handle(self, *args, **kwargs):
        # Check if the bot user exists
        if not User.objects.filter(id=-1).exists():
            # Create the bot user with id=-1
            User.objects.create(id=-1, username="Bot", email="bot@example.com", status=User.UserStatus.ONLINE)
            self.stdout.write(self.style.SUCCESS("Successfully created bot user with id=-1"))
        else:
            self.stdout.write(self.style.SUCCESS("Bot user already exists"))