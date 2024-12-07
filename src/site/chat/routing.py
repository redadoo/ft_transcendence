from django.urls import re_path
from .consumer import liarsBarConsumer

websocket_chat_urlpatterns = [
    re_path(
        r"ws/chat_system/", liarsBarConsumer.as_asgi()
    ),
]
