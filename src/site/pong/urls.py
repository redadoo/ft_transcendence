from django.urls import path

from . import views

urlpatterns = [
    path("api/singleplayer/pong", views.start_singleplayer_pong_game, name="singleplayer_pong"),
    path("api/multiplayer/pong", views.start_multiplayer_pong_game, name="multiplayer_pong"),
    path("api/multiplayer/pong/matchmaking", views.pong_matchmaking, name="pong_matchmaking"),
]