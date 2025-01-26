from django.urls import path

from . import views

urlpatterns = [
    path("api/singleplayer/pong", views.start_singleplayer_pong_game, name="singleplayer_pong"),
    path("api/multiplayer/pong", views.start_multiplayer_pong_game, name="multiplayer_pong"),
    # path("api/tournament/pong", views.start_tournament_pong, name="tournament_pong"),
]