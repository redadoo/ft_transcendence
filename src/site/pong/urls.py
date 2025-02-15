from django.urls import path

from pong.views import *

urlpatterns = [
    path('api/pong/init', PongInitView.as_view()),
    path('api/pong/check_lobby', PongCheckLobby.as_view()),
    path('api/pong/room_state', PongRoomState.as_view()),
    path('api/pong/start_lobby', PongStartLobbyView.as_view()),
    path('api/pong/player_control', PongPlayerControlView.as_view()),
    path('api/pong/last_match', LastPongMatchView.as_view()),
]