from django.urls import re_path
from .consumer import liarsBarConsumer

websocket_liarsbar_urlpatterns = [
    re_path(
        r"ws/multiplayer/liarsbar/(?P<room_name>[\w\-]+)$", liarsBarConsumer.as_asgi()
    ),
]
