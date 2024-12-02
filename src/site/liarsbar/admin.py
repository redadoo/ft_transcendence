from django.contrib import admin
from liarsbar.models import LiarsBarMatch

class LiarsBarMatchAdmin(admin.ModelAdmin):
    """
    Admin interface for managing LiarsBarMatch.
    """
    list_display = (
        "id",
        "first_user",
        "second_user",
        "third_user",
        "fourth_user",
        "user_winner",
        "start_date",
        "end_date",
    )
    list_filter = ("start_date", "end_date")
    search_fields = (
        "first_user__username",
        "second_user__username",
        "third_user__username",
        "fourth_user__username",
        "user_winner__username",
    )
    ordering = ("-start_date",)
    autocomplete_fields = ["first_user", "second_user", "third_user", "fourth_user", "user_winner"]

admin.site.register(LiarsBarMatch, LiarsBarMatchAdmin)