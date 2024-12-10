from django.db import models
from django.conf import settings
from pong.models import PongMatch
from liarsbar.models import LiarsBarMatch
from datetime import datetime
from django.contrib.auth.models import AbstractUser, Group, Permission

exp_for_level = [
	766, 1568, 2390, 3232, 4095, 4981, 5894, 6835, 7808, 8814,
	9855, 10932, 12048, 13203, 14399, 15635, 16912, 18231, 19593, 20996
]


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
	username = models.CharField(max_length=12, unique=True)
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
	
	@classmethod
	def create_new_user(cls, username, email):
		"""
		Class method to create a new user.
		"""
		if cls.objects.filter(username=username).exists():
			raise ValueError(f"User with username '{username}' already exists.")
		if cls.objects.filter(email=email).exists():
			raise ValueError(f"User with email '{email}' already exists.")
		user = cls(username=username, email=email)
		user.save()
		return user

class UserStats(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='user_stat',
		primary_key=True
	)
	
	exp = models.IntegerField(default=0)
	mmr = models.IntegerField(default=1000)
	win = models.IntegerField(default=0)
	lose = models.IntegerField(default=0)
	longest_winstreak = models.IntegerField(default=0)
	longest_losestreak = models.IntegerField(default=0)
	total_points_scored = models.IntegerField(default=0)
	longest_game = models.IntegerField(default=0)
	time_on_site = models.IntegerField(default=0)

	date_updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Stats for {self.user.username}"

	def get_level(self):
		for index, value in enumerate(exp_for_level):
			if self.exp < value:
				return index + 1 
		return len(exp_for_level) 
	
	def get_cap_exp(self):
		value = 0
		for index, value in enumerate(exp_for_level):
			if (self.exp < value):
				break
		return value
		
	def get_percentage_next_level(self):
		current_level = self.get_level() 
		
		previous_level_exp = exp_for_level[current_level - 2] if current_level > 1 else 0
		next_level_exp = exp_for_level[current_level - 1]

		progress = self.exp - previous_level_exp
		level_range = next_level_exp - previous_level_exp

		percentage = (progress / level_range) * 100 if level_range > 0 else 100

		return f"{percentage:.2f}%"

	class Meta:
		verbose_name = "User Stat"
		verbose_name_plural = "User Stats"

class Friendships(models.Model):

	class FriendshipsStatus(models.IntegerChoices):
		PENDING = 1, "pending"
		FRIENDS = 2, "friends"
		BLOCK = 3, "block"

	status = models.IntegerField(
		choices=FriendshipsStatus.choices,
		default=FriendshipsStatus.PENDING,
		help_text="The user who initiated the friendship."
	)

	first_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="riendships_initiated",
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
		return self.status == self.FriendshipsStatus.BLOCK

	def save(self, *args, **kwargs):
		if self.first_user.id > self.second_user.id:
			self.first_user, self.second_user = self.second_user, self.first_user
		super(Friendships, self).save(*args, **kwargs)
	
	class Meta:
		db_table = "Friendships"
		
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

	user_avatar = models.ImageField(upload_to="media/",default='media/default_avatar.png')
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
