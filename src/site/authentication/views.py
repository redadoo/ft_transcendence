import secrets
import requests

from django.views import View
from .form import UserCreationForm
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse, HttpResponseBadRequest

from website.models import *

from rest_framework import viewsets
from website.models import User
from .serializers import UserSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import redirect, render

class UserViewSet(viewsets.ModelViewSet):
	serializer_class = UserSerializer
	queryset = User.objects.all()

	def get_queryset(self):
		queryset = super(UserViewSet, self).get_queryset()

		username = self.request.query_params.get('username', None)
		if username:
			queryset = queryset.filter(username=username)

		return queryset

	@action(detail=False, methods=['post'])
	def register(self, request):
		form = UserCreationForm(request.data)
		if form.is_valid():
			new_user = form.save()
			UserStats.objects.create(user=new_user)
			UserImage.objects.create(user=new_user)
			return Response({"success": "true"})
		return Response({"success": "false", "errors": form.errors})

	@action(detail=False, methods=['post'])
	def login(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		if user is not None:
			login(request,user)
			return Response({"success": "true"})
		return Response({"success": "false"})

	@action(detail=False, methods=['get'])
	def logout(self, request):
		logout(request)
		return Response({"success": "true"})

	@action(detail=False, methods=['get'])
	def is_logged_in(self, request):
		if request.user.is_authenticated:
			return Response({"success": "true"})
		return Response({"success": "false"})

class Auth42(View):
	state = secrets.token_urlsafe(32)

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.params_auth = {
			"client_id": "u-s4t2ud-7913cbc4cbaed9a2d5e9b33fcd888a0d3c5d00ba256b7844ef00714c3e9580cf",
			"redirect_uri": "http://127.0.0.1:8000/oauth_callback",
			"response_type": "code",
			"state": self.state
		}

		self.params_token = {
			"grant_type": "authorization_code",
			"client_id": "u-s4t2ud-7913cbc4cbaed9a2d5e9b33fcd888a0d3c5d00ba256b7844ef00714c3e9580cf",
			"client_secret": "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",
			"redirect_uri": self.params_auth["redirect_uri"]
		}

	def get(self, request, *args, **kwargs):
		"""Handle both login initiation and callback."""
		if request.path == "/42login":
			return self.user_42login()
		elif request.path == "/oauth_callback":
			return self.handle_callback(request)
		else:
			return HttpResponseBadRequest("Invalid path.")


	def user_42login(self):
		"""Redirect to 42's OAuth login page."""
		base_uri = "https://api.intra.42.fr/oauth/authorize"
		query_string = "&".join(f"{key}={value}" for key, value in self.params_auth.items())
		redirect_url = f"{base_uri}?{query_string}"
		print(redirect_url)
		return redirect(redirect_url)

	def handle_callback(self, request):
		code = request.GET.get('code')

		self.params_token["code"] = code
		token_url = "https://api.intra.42.fr/oauth/token"
		response = requests.post(token_url, data=self.params_token)

		if response.status_code == 200:
			token_data = response.json()
			user_data_response = requests.get(
				"https://api.intra.42.fr/v2/me",
				headers={"Authorization": f"Bearer {token_data['access_token']}"}
			)

			if user_data_response.status_code == 200:
				user_data = user_data_response.json()
				try:
					username = user_data.get('login')
					email = user_data.get('email')

					user42, created = User.objects.get_or_create(
						username=username,
						defaults={"email": email}
					)

					if created:
						UserStats.objects.create(user=user42)
						UserImage.objects.create(user=user42)

					login(request, user42)
					return render(request,'main.html')
				except Exception as e:
					return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=400)
			else:
				return JsonResponse(
					{"error": "Failed to retrieve user data", "details": user_data_response.text},
					status=user_data_response.status_code
				)
		else:
			return JsonResponse(
				{"error": "Failed to retrieve token", "details": response.text},
				status=response.status_code
			)
