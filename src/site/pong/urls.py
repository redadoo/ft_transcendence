from django.urls import path

from pong.views import LastPongMatchView

urlpatterns = [
    path('api/pong/last_match', LastPongMatchView.as_view()),
]