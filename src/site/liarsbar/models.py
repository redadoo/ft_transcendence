from django.db import models
from django.conf import settings
from django.utils.timezone import now

# Create your models here.

class LiarsBarMatch(models.Model):
	"""
	Model representing a Liars Bar match between four users.
	"""

	id = models.AutoField(primary_key=True)
	first_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="liarsbar_matches_as_first_user",
		help_text="Reference to the first user."
	)
	second_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="liarsbar_matches_as_second_user",
		help_text="Reference to the second user."
	)
	third_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="liarsbar_matches_as_third_user",
		help_text="Reference to the third user."
	)
	fourth_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="liarsbar_matches_as_fourth_user",
		help_text="Reference to the fourth user."
	)
	user_winner = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="liarsbar_wins",
		help_text="The user who won the match."
	)
	start_date = models.DateTimeField(
		default=now,
		help_text="Timestamp when the match started."
	)
	end_date = models.DateTimeField(
		null=True,
		blank=True,
		help_text="Timestamp when the match ended."
	)

	def __str__(self):
		"""
		String representation of the LiarsBarMatch instance.
		"""
		return f"Liars Bar Match: {self.first_user.username}, {self.second_user.username}, {self.third_user.username}, {self.fourth_user.username}"

	class Meta:	
		verbose_name = "Liars bar match"


	def get_duration(self):
		if self.end_date:
			duration = self.end_date - self.start_date
			total_seconds = int(duration.total_seconds())
			minutes, seconds = divmod(total_seconds, 60)

			start_date_formatted = self.start_date.strftime("%d-%m-%Y")

			return f"{start_date_formatted} {minutes}m {seconds}s"
		else:
			return "Match is still ongoing"