from django.urls import path, re_path
from . import views
from .views import UserProfileView, UsersView, ChangePasswordView

urlpatterns = [
    path('api/profile', UserProfileView.as_view()),
     path('api/change_password', ChangePasswordView.as_view()),
    path('api/users', UsersView.as_view()),
    path('', views.main_page, name='main_page'),
    re_path(r'^(?!media/).*$', views.main_page),
]
