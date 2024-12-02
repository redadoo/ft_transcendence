# authentication/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('42login', views.Auth42.as_view(), name='user_42login'),
    path('oauth_callback', views.Auth42.as_view(), name='handle_42_callback'),
    path('api/', include(router.urls)),
]
