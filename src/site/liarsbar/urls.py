from django.urls import path

from . import views


urlpatterns = [
    path("api/multiplayer/liarsbar", views.start_singleplayer_liarsbar_game, name="multiplayer_liarsbar"),
]