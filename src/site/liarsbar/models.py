from django.db import models
from django.conf import settings

class LiarsBarMatch(models.Model):
    """
    Model representing a Liars Bar match between up to four users.
    """

    id = models.AutoField(primary_key=True)
    first_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,  # Keeps the match but sets this user to null if deleted
        related_name="liarsbar_matches_as_first_user",
        null=True,
        blank=True,
        help_text="Reference to the first user."
    )
    second_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="liarsbar_matches_as_second_user",
        null=True,
        blank=True,
        help_text="Reference to the second user."
    )
    third_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="liarsbar_matches_as_third_user",
        null=True,
        blank=True,
        help_text="Reference to the third user."
    )
    fourth_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="liarsbar_matches_as_fourth_user",
        null=True,
        blank=True,
        help_text="Reference to the fourth user."
    )
    user_winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="liarsbar_wins",
        null=True,
        blank=True,
        help_text="The user who won the match."
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

    def __str__(self):
        """
        String representation of the LiarsBarMatch instance.
        """
        users = [
            self.first_user.username if self.first_user else "None",
            self.second_user.username if self.second_user else "None",
            self.third_user.username if self.third_user else "None",
            self.fourth_user.username if self.fourth_user else "None",
        ]
        return f"Liars Bar Match: {', '.join(users)}"

    class Meta:
        verbose_name = "Liars bar match"

    def get_duration(self):
        """
        Calculate and return the match duration.
        """
        if self.end_date:
            duration = self.end_date - self.start_date
            total_seconds = int(duration.total_seconds())
            minutes, seconds = divmod(total_seconds, 60)
            start_date_formatted = self.start_date.strftime("%d-%m-%Y")
            return f"{start_date_formatted} {minutes}m {seconds}s"
        else:
            return "Match is still ongoing"

    def get_player_xp_gained(self, username: str):
        if username == self.user_winner.username:
            return 100
        return 10