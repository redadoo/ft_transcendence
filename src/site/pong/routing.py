from django.urls import re_path
from .consumer import *

websocket_pong_urlpatterns = [
	re_path(
		r"ws/singleplayer/pong/",
		PongSingleplayerConsumer.as_asgi()
	),
    
	re_path(
		r"ws/lobby/pong/",
		PongLobbyConsumer.as_asgi()
	),

	re_path(
		r"ws/multiplayer/pong/matchmaking",
		PongMatchmaking.as_asgi()
	),
	
	re_path(
		r"ws/multiplayer/pong/(?P<room_name>[\w\-]+)$",
		PongMultiplayerConsumer.as_asgi()
	),

	re_path(
		r"ws/multiplayer/pong_tournament/(?P<room_name>[\w\-]+)$",
		PongMultiplayerConsumer.as_asgi()
	),
]
