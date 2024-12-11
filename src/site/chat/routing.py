from django.urls import re_path
from .consumer import ChatConsumer

websocket_chat_urlpatterns = [
    re_path(r'ws/chat/$', ChatConsumer.as_asgi()),
]
