from django.urls import path, re_path
from . import views
from .views import UserProfileView

urlpatterns = [
    path('api/profile', UserProfileView.as_view()),
    path('', views.main_page, name='main_page'),
    re_path(r'^(?!media/).*$', views.main_page),
]
