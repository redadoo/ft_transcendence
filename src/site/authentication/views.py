import os
import secrets
import requests

from django.views import View
from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse, HttpResponseBadRequest
from django.urls import reverse

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

from asgiref.sync import async_to_sync
from social.consumer import send_event_to_all_consumer

from website.models import User, UserStats, UserImage
from .form import UserCreationForm
from .serializers import UserSerializer
from urllib.parse import quote, urlencode

class UserViewSet(viewsets.ModelViewSet):
	serializer_class = UserSerializer
	queryset = User.objects.all()

	def get_queryset(self):
		username = self.request.query_params.get('username')
		return self.queryset.filter(username=username) if username else self.queryset

	@action(detail=False, methods=['post'])
	def register(self, request):
		form = UserCreationForm(request.data)
		if form.is_valid():
			new_user = form.save()
			UserStats.objects.create(user=new_user)
			UserImage.objects.create(user=new_user)
			async_to_sync(send_event_to_all_consumer)("get_update_users", {"username": new_user.username})
			return Response({"success": "true"})
		return Response({"success": "false", "errors": form.errors})

	@action(detail=False, methods=['post'])
	def login(self, request):
		user = authenticate(username=request.data.get('username'), password=request.data.get('password'))
		if user:
			login(request, user)
			return Response({"success": "true"})
		return Response({"success": "false"})

	@action(detail=False, methods=['get'])
	def logout(self, request):
		logout(request)
		return Response({"success": "true"})

	@action(detail=False, methods=['get'])
	def is_logged_in(self, request):
		return Response({"success": "true" if request.user.is_authenticated else "false"})


class Auth42(View):
	state = secrets.token_urlsafe(32)

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.client_id = os.environ.get("42_CLIENT_ID")
		self.client_secret = os.environ.get("42_AUTH_CLIENT_SECRET")

	def get(self, request, *args, **kwargs):
		"""
		Handle both login initiation and callback.
		Use the same redirect_uri for both authorization and token exchange.
		"""
		# Build the redirect URI without pre-encoding
		redirect_uri = request.build_absolute_uri(reverse("oauth_callback"))

		if request.path == reverse("user_42login"):
			return self.user_42login(redirect_uri)
		elif request.path == reverse("oauth_callback"):
			return self.handle_callback(request, redirect_uri)
		return HttpResponseBadRequest("Invalid path.")

	def user_42login(self, redirect_uri):
		"""
		Redirect the user to 42's OAuth login page.
		The query string is built using urlencode to handle proper percent-encoding.
		"""
		params_auth = {
			"client_id": self.client_id,
			"redirect_uri": redirect_uri,
			"response_type": "code",
			"state": self.state
		}
		auth_url = "https://api.intra.42.fr/oauth/authorize?" + urlencode(params_auth)
		return redirect(auth_url)

	def handle_callback(self, request, redirect_uri):
		"""
		Handle OAuth callback, exchange code for token, and authenticate user.
		"""
		code = request.GET.get("code")
		if not code:
			return JsonResponse({"error": "Missing authorization code"}, status=400)

		token_response = requests.post(
			"https://api.intra.42.fr/oauth/token",
			data={
				"grant_type": "authorization_code",
				"client_id": self.client_id,
				"client_secret": self.client_secret,
				"redirect_uri": redirect_uri,
				"code": code
			},
		)

		if token_response.status_code != 200:
			return JsonResponse(
				{"error": "Failed to retrieve token", "details": token_response.text},
				status=token_response.status_code,
			)

		token_data = token_response.json()
		user_data_response = requests.get(
			"https://api.intra.42.fr/v2/me",
			headers={"Authorization": f"Bearer {token_data['access_token']}"},
		)

		if user_data_response.status_code != 200:
			return JsonResponse(
				{"error": "Failed to retrieve user data", "details": user_data_response.text},
				status=user_data_response.status_code,
			)

		user_data = user_data_response.json()
		username, email = user_data.get("login"), user_data.get("email")

		user42, created = User.objects.get_or_create(account42Nickname=username, defaults={"email": email})
		if created:
			user42.username = user42.account42Nickname
			UserStats.objects.create(user=user42)
			UserImage.objects.create(user=user42)

		login(request, user42)
		return render(request, "main.html")