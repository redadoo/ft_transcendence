import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

from pong.routing import websocket_pong_urlpatterns
from liarsbar.routing import websocket_liarsbar_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ft_transcendence.settings')

django_asgi_app = get_asgi_application()

websocket_urlpatterns = websocket_pong_urlpatterns + websocket_liarsbar_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,  # Handles HTTP requests
    "websocket": AllowedHostsOriginValidator(  # Handles WebSocket requests
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})