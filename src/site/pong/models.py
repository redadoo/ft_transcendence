from django.db import models
from django.conf import settings
from channels.db import database_sync_to_async

class PongMatch(models.Model):
	"""
	Model representing a pong match between two users.
	"""

	id = models.AutoField(primary_key=True)
	first_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="matches_as_first_user",
		help_text="Reference to the first user.",
	)
	second_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="matches_as_second_user",
		help_text="Reference to the second user.",
	)

	first_user_score = models.IntegerField(
		default=0, help_text="Score of the first user."
	)
	
	second_user_score = models.IntegerField(
		default=0, help_text="Score of the second user."
	)
	
	first_user_mmr_gain = models.IntegerField(
		default=0, help_text="MMR gain for the first user."
	)
	
	second_user_mmr_gain = models.IntegerField(
		default=0, help_text="MMR gain for the second user."
	)
	
	start_date = models.DateTimeField(
		null=True,
		blank=True,
		help_text="Timestamp when the match started."
	)
	end_date = models.DateTimeField(
		null=True,
		blank=True,
		help_text="Timestamp when the match ended.",
		auto_now=True
	)

	def get_winner(self):
		if self.first_user is None or self.second_user is None:
			return "unknown"

		if self.first_user_score > self.second_user_score:
			return self.first_user.username
		elif self.first_user_score < self.second_user_score:
			return self.second_user.username
		return "Tie"

	def get_duration_minutes(self):
		if self.end_date:
			duration = self.end_date - self.start_date
			total_seconds = int(duration.total_seconds())
			minutes, seconds = divmod(total_seconds, 60)
			return minutes
		return 0

	def get_duration(self):
		if self.end_date:
			duration = self.end_date - self.start_date
			total_seconds = int(duration.total_seconds())
			minutes, seconds = divmod(total_seconds, 60)

			start_date_formatted = self.start_date.strftime("%d-%m-%Y")
			return f"{start_date_formatted} {minutes}m {seconds}s"
		else:
			return "Match is still ongoing"


	@staticmethod
	def static_get_player_mmr_gained(is_first_player, first_score, second_score):
		"""
		Calculate MMR gained for a player based on their score and whether they are the first player.
		
		Args:
			is_first_player (bool): True if calculating for the first player, False for the second.
			first_score (int): Score of the first player.
			second_score (int): Score of the second player.
		
		Returns:
			int: MMR gained for the player.
		"""
		player_won = first_score > second_score if is_first_player else second_score > first_score
		return 100 if player_won else 10

		

	def get_player_xp_gained(self, username: str):
		if username == self.get_winner():
			return 100
		return 10

	def get_player_mmr_gained(self, user):
		if user == self.first_user:
			return self.first_user_mmr_gain
		return self.second_user_mmr_gain  

	def get_player_point_scored(self, user):
		if user == self.first_user:
			return self.first_user_score
		return self.second_user_score  

	def __str__(self):
		"""
		String representation of the PongMatch instance.
		"""
		first_username = self.first_user.username if self.first_user else "Unknown"
		second_username = self.second_user.username if self.second_user else "Unknown"
		return f"{first_username} vs {second_username}"

	class Meta:	
		verbose_name = "Pong match"

class PongTournament(models.Model):
	"""
	Model representing a pong tournament, which contains multiple matches.
	"""

	id = models.AutoField(primary_key=True)

	players = models.ManyToManyField(
		settings.AUTH_USER_MODEL, 
		related_name="tournaments", 
		help_text="Users in the tournament."
	)

	start_date = models.DateTimeField(
		null=True, 
		blank=True, 
		help_text="Timestamp when the tournament started."
	)

	end_date = models.DateTimeField(
		null=True, 
		blank=True, 
		help_text="Timestamp when the tournament ended."
	)
	
	winner = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="won_tournaments",
		help_text="The winner of the tournament.",
	)

	@database_sync_to_async
	def _get_players(self, players_id):
		"""Fetch all players in one query (optimized)."""
		from website.models import User
		return list(User.objects.filter(id__in=players_id))

	@database_sync_to_async
	def _set_players(self, players):
		"""Set players in the tournament."""
		self.players.set(players)
		self.save()

	async def add_players_to_tournament(self, players_id):
		"""Async method to add players to the tournament."""
		print(players_id)
		players = await self._get_players(players_id)
		print(players)
		await self._set_players(players)

	@database_sync_to_async
	def _get_winner(self, player_id):
		"""Fetch winner asynchronously."""
		from website.models import User
		return User.objects.get(id=player_id)

	@database_sync_to_async
	def _save(self):
		"""Save tournament asynchronously."""
		self.save()

	async def set_winner(self, player_id):
		"""Async method to set the winner of the tournament."""
		winner = await self._get_winner(player_id)
		self.winner = winner
		await self._save()

	class Meta:
		verbose_name = "Pong tournament"
		verbose_name_plural = "Pong tournaments"
