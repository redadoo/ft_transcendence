from django.urls import re_path
from .consumer import SocialConsumer

websocket_social_urlpatterns = [
    re_path(r'ws/social/', SocialConsumer.as_asgi()),
]
