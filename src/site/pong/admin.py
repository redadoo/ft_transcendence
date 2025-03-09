from django.contrib import admin
from pong.models import PongMatch
from pong.models import PongTournament, PongMatch

class PongMatchAdmin(admin.ModelAdmin):
	"""
	Admin interface for managing PongMatch.
	"""
	list_display = (
		"id",
		"first_user",
		"second_user",
		"first_user_score",
		"second_user_score",
		"start_date",
		"end_date",
	)
	list_filter = ("start_date", "end_date")
	search_fields = ("first_user__username", "second_user__username")
	ordering = ("-start_date",)
	autocomplete_fields = ["first_user", "second_user"]

class PongMatchInline(admin.TabularInline):
    model = PongTournament.matches.through
    extra = 1

class PongTournamentAdmin(admin.ModelAdmin):
    inlines = [PongMatchInline]

admin.site.register(PongTournament, PongTournamentAdmin)
admin.site.register(PongMatch, PongMatchAdmin)