from . import views
from django.urls import path

urlpatterns = [
    path("api/multiplayer/liarsbar", views.start_multiplayer_liarsbar_game, name="multiplayer_liarsbar"),
]