from django.db import models
from django.conf import settings
from django.forms import ValidationError
from pong.models import PongMatch
from liarsbar.models import LiarsBarMatch
from datetime import datetime
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinLengthValidator, RegexValidator, MinValueValidator

class User(AbstractUser):
	"""
	Model representing a user, with username, email, and password.
	"""
	class UserStatus(models.IntegerChoices):
		ONLINE = 1, "Online"
		OFFLINE = 2, "Offline"
		AWAY = 3, "Away"
		BUSY = 4, "Busy"
		MATCHMAKING = 5, "In Matchmaking"
		PLAYING = 6, "playing"


	id = models.AutoField(primary_key=True)
	username = models.CharField(
		max_length=12,
		unique=True,
		validators=[
			MinLengthValidator(3),
			RegexValidator(r'^[a-zA-Z0-9_.-]+$', 'Username can only contain letters, numbers, underscores, and periods.')
		],
		help_text="User's unique username."
	)
	email = models.EmailField(max_length=100, unique=True)
	
	status = models.IntegerField(
		choices=UserStatus.choices,
		default=UserStatus.OFFLINE,
		help_text="The current status of the user."
	)

	created_at = models.DateField(auto_now_add=True, help_text="The date and time when the object was created.")
	updated_at = models.DateField(auto_now=True, help_text="The date and time when the object was last updated.")
 
	groups = models.ManyToManyField(
		Group,
		related_name="User_groups",  
		blank=True,
		help_text="The groups this user belongs to.",
	)
	user_permissions = models.ManyToManyField(
		Permission,
		related_name="User_permissions",
		blank=True,
		help_text="Specific permissions for this user."
	)

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = ['email']

	def __str__(self):
		"""
		String representation of the User instance, displaying the username and ID.
		"""
		return f"{self.username}"
	
	@staticmethod
	def is_valid_status(input_status: str) -> bool:
		"""
		Static method to check if a given string is a valid status.
		"""
		return input_status in dict(User.UserStatus.choices).values()

	@staticmethod
	def get_status_key(input_status: str) -> int:
		"""
		Get the integer key corresponding to the status string.
		"""
		reverse_choices = {v: k for k, v in dict(User.UserStatus.choices).items()}
		return reverse_choices.get(input_status)
	
	@staticmethod
	def get_status_name(key_input_status: int) -> str:
		"""
		Get the integer key corresponding to the status string.
		"""
		return User.UserStatus(key_input_status).label

	@classmethod
	def create_new_user(cls, username, email, password=None):
		"""
		Class method to create a new user with optional password.
		"""
		if cls.objects.filter(username=username).exists():
			raise ValueError(f"User with username '{username}' already exists.")
		if cls.objects.filter(email=email).exists():
			raise ValueError(f"User with email '{email}' already exists.")
		user = cls(username=username, email=email)
		if password:
			user.set_password(password)
		user.save()
		return user


	class Meta:
		db_table = "Users"

class UserStats(models.Model):
    """
    Model to track a user's statistics, including experience, match performance, and activity.
    """
    exp_for_level = [
        766, 1568, 2390, 3232, 4095, 4981, 5894, 6835, 7808, 8814,
        9855, 10932, 12048, 13203, 14399, 15635, 16912, 18231, 19593, 20996
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_stat',
        primary_key=True
    )

    exp = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    mmr = models.PositiveIntegerField(default=1000, validators=[MinValueValidator(0)])
    win = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    lose = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    longest_winstreak = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    longest_losestreak = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    total_points_scored = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    longest_game = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])  # Measured in seconds
    time_on_site = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])  # Measured in seconds

    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Stats for {self.user.username}"

    @property
    def level(self):
        """
        Get the user's current level based on experience points.
        """
        return next((index + 1 for index, level_exp in enumerate(self.exp_for_level) if self.exp < level_exp), len(self.exp_for_level))

    @property
    def cap_exp(self):
        """
        Get the experience required for the next level cap.
        """
        return next((level_exp for level_exp in self.exp_for_level if self.exp < level_exp), self.exp_for_level[-1])

    @property
    def percentage_next_level(self):
        """
        Calculate the percentage of progress towards the next level.
        """
        current_level = self.level
        previous_level_exp = self.exp_for_level[current_level - 2] if current_level > 1 else 0
        next_level_exp = self.exp_for_level[current_level - 1]

        progress = self.exp - previous_level_exp
        level_range = next_level_exp - previous_level_exp

        return f"{(progress / level_range) * 100:.2f}%" if level_range > 0 else "100.00%"

    class Meta:
        verbose_name = "User Stat"
        verbose_name_plural = "User Stats"
        db_table = "user_stats"

class Friendships(models.Model):

	class FriendshipsStatus(models.IntegerChoices):
		PENDING = 1, "pending"
		FRIENDS = 2, "friends"
		FIRST_USER_BLOCK = 3, "first_user_block"
		SECOND_USER_BLOCK = 4, "second_user_block"

	status = models.IntegerField(
		choices=FriendshipsStatus.choices,
		default=FriendshipsStatus.PENDING,
		help_text="The user who initiated the friendship."
	)

	first_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="friendships_initiated",
		help_text="The user associated with the match history."
	)

	second_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="friendships_received",
		help_text="The user who received the friendship request."
	)

	date_created = models.DateTimeField(auto_now_add=True)
	date_updated = models.DateTimeField(auto_now=True)

	def is_friend(self):
		return self.status == self.FriendshipsStatus.FRIENDS

	def is_pending(self):
		return self.status == self.FriendshipsStatus.PENDING

	def is_blocked(self):
		return self.status in (
			self.FriendshipsStatus.FIRST_USER_BLOCK,
			self.FriendshipsStatus.SECOND_USER_BLOCK
		)

	def clean(self):
		if self.first_user == self.second_user:
			raise ValidationError("A user cannot be friends with themselves.")

	class Meta:
		db_table = "Friendships"
		unique_together = ('first_user', 'second_user')
		
		indexes = [
			models.Index(fields=['status']),
			models.Index(fields=['first_user']),
			models.Index(fields=['second_user']),
		]

class UserImage(models.Model):

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE, 
		related_name='user_image',
		primary_key=True
	)

	user_avatar = models.ImageField(upload_to="avatars/", default="avatars/default_avatar.png")
	date_created = models.DateTimeField(auto_now_add=True)
	date_updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Image for {self.user.username}"

	class Meta:
		verbose_name = "user Image"
		verbose_name_plural = "user Images"

class MatchHistory(models.Model):
	"""
	Model representing the history of matches for a user.
	"""

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="match_history",
		help_text="The user associated with the match history."
	)
	pong_matches = models.ManyToManyField(
		PongMatch,
		related_name="user_histories",
		blank=True,
		help_text="The Pong matches associated with this user."
	)
	liarsbar_matches = models.ManyToManyField(
		LiarsBarMatch,
		related_name="user_histories",
		blank=True,
		help_text="The Liars Bar matches associated with this user."
	)

	def get_all_matches(self):
		"""
		Combines and sorts all matches by start date.
		"""

		pong_matches = list(self.pong_matches.all())
		liarsbar_matches = list(self.liarsbar_matches.all())

		all_matches = pong_matches + liarsbar_matches
		all_matches.sort(key=lambda match: getattr(match, 'start_date', datetime.min))
		return all_matches

	def __str__(self):
		"""
		String representation of the MatchHistory instance.
		"""
		return f"Match History for {self.user.username}"
	
	class Meta:
		verbose_name = "Match history"
