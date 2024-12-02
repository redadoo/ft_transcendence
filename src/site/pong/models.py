from django.db import models
from django.conf import settings
from django.utils.timezone import now

class PongMatch(models.Model):
	"""
	Model representing a pong match between two users.
	"""

	id = models.AutoField(primary_key=True)
	first_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="matches_as_first_user",
		help_text="Reference to the first user.",
	)
	second_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
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
		default=now, help_text="Timestamp when the match started."
	)
	
	end_date = models.DateTimeField(
		null=True,
		blank=True,
		help_text="Timestamp when the match ended.",
	)

	def get_winner(self):
		if self.first_user_score > self.second_user_score:
			return self.first_user.username
		elif self.first_user_score < self.second_user_score:
			return self.second_user.username
		return "Tie"


	def get_duration(self):
		if self.end_date:
			duration = self.end_date - self.start_date
			total_seconds = int(duration.total_seconds())
			minutes, seconds = divmod(total_seconds, 60)

			start_date_formatted = self.start_date.strftime("%d-%m-%Y")

			return f"{start_date_formatted} {minutes}m {seconds}s"
		else:
			return "Match is still ongoing"



	def __str__(self):
		"""
		String representation of the PongMatch instance.
		"""
		return f"Pong Match between {self.first_user.username} and {self.second_user.username}"

	class Meta:	
		verbose_name = "Pong match"