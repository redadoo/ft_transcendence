from django.urls import re_path
from .consumer import *

websocket_liarsbar_urlpatterns = [
	re_path(
		r"ws/multiplayer/liarsbar/(?P<room_name>[\w\-]+)$", liarsBarConsumer.as_asgi()
	),
	re_path(
		r"ws/multiplayer/pong/matchmaking", LiarsBarGameManager.as_asgi()
	),
]
