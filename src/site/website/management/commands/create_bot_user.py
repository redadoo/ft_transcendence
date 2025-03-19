from django.core.management.base import BaseCommand
from website.models import User, UserStats, UserImage

class Command(BaseCommand):
    help = 'Create bot users with specific negative IDs if they do not exist.'

    def create_bot_user(self, user_id, username, email):
        """Helper method to create a bot user along with UserStats and UserImage."""
        bot_user = User.objects.create(
            id=user_id,
            username=username,
            email=email,
            status=User.UserStatus.ONLINE
        )
        if username != "admin":
            bot_user.set_password("bot")
            bot_user.save()
        else:
            bot_user.is_staff = True
            bot_user.is_superuser = True
            bot_user.set_password("admin")
            bot_user.save()

        UserStats.objects.create(user=bot_user)
        UserImage.objects.create(user=bot_user)

        self.stdout.write(self.style.SUCCESS(f"Successfully created bot user with id={user_id}"))

    def handle(self, *args, **kwargs):
        bot_users = [
            {'id': -1, 'username': 'bot', 'email': 'bot@example.com'},
            {'id': -2, 'username': 'bot_2', 'email': 'bot_2@example.com'},
            {'id': -3, 'username': 'bot_3', 'email': 'bot_3@example.com'},
            {'id': -4, 'username': 'bot_4', 'email': 'bot_4@example.com'},
            {'id': 9999, 'username': 'admin', 'email': 'admin@example.com'},
            {'id': 9998, 'username': 'edo', 'email': 'edo@example.com'},
            {'id': 9997, 'username': 'edo2', 'email': 'edo2@example.com'},
            {'id': 9996, 'username': 'edo3', 'email': 'edo3@example.com'},

        ]

        for bot in bot_users:
            if not User.objects.filter(id=bot['id']).exists():
                self.create_bot_user(bot['id'], bot['username'], bot['email'])
            else:
                self.stdout.write(self.style.WARNING(f"Bot user with id={bot['id']} already exists"))
