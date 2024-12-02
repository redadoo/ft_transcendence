from django.urls import path

from . import views


urlpatterns = [
    path("api/multiplayer/liarsbar", views.start_multiplayer_liarsbar_game, name="multiplayer_liarsbar"),
]