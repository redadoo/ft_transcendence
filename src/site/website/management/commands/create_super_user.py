from django.core.management.base import BaseCommand
from website.models import User, UserStats, UserImage, MatchHistory

class Command(BaseCommand):
    help = 'Create bot users with specific negative IDs if they do not exist.'

    def create_super_user(self, user_id, username, email):
        """Helper method to create a bot user along with UserStats and UserImage."""
        bot_user = User.objects.create_superuser(
            id=user_id,
            username=username,
            email=email,
            status=User.UserStatus.ONLINE
        )

        stat = UserStats.objects.create(user=bot_user)
        image = UserImage.objects.create(user=bot_user)
        match = MatchHistory.objects.create(user=bot_user)

        bot_user.set_password("admin")
        bot_user.save()
        stat.save()
        image.save()
        match.save()

        self.stdout.write(self.style.SUCCESS(f"Successfully created bot user with id={user_id}"))

    def handle(self, *args, **kwargs):
        bot_users = [
            {'id': 1, 'username': 'admin', 'email': 'admin@example.com'},
        ]

        for bot in bot_users:
            if not User.objects.filter(id=bot['id']).exists():
                self.create_super_user(bot['id'], bot['username'], bot['email'])
            else:
                self.stdout.write(self.style.WARNING(f"Bot user with id={bot['id']} already exists"))
