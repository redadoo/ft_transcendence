from django.urls import path
from .view import LastLiarsbarMatchView

urlpatterns = [
    path('api/liarsbar/last_match', LastLiarsbarMatchView.as_view()),
]
