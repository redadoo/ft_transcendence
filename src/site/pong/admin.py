from django.contrib import admin
from pong.models import PongMatch

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

from django.contrib import admin
from pong.models import PongTournament, PongMatch

class PongMatchInline(admin.TabularInline):
	"""
	Inline admin for showing related PongMatch objects within PongTournament admin.
	"""
	model = PongTournament.matches.through
	extra = 0

class PongTournamentAdmin(admin.ModelAdmin):
	"""
	Admin interface for managing PongTournament.
	"""
	list_display = (
		"id",
		"start_date",
		"end_date",
		"winner",
	)
	list_filter = ("start_date", "end_date", "winner")
	search_fields = ("winner__username",)
	ordering = ("-start_date",)
	inlines = [PongMatchInline]

admin.site.register(PongTournament, PongTournamentAdmin)
admin.site.register(PongMatch, PongMatchAdmin)