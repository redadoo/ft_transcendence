from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from website.models import User, UserImage
from website.form import UserImageForm
from .serializers import UserProfileSerializer, SimpleUserProfileSerializer, ChangePasswordSerializer
from rest_framework.response import Response
from django.middleware.csrf import get_token
from django.core.validators import validate_slug
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils.crypto import get_random_string
from django.db.utils import DatabaseError, OperationalError

def main_page(request, unused_path=None):
	nonce = get_random_string(16)
	csrf_token = get_token(request)
	csp_policy = (f"script-src 'self' 'nonce-{nonce}' blob:; ")
	response = render(request, 'main.html', {'csrf_token': csrf_token, 'nonce': nonce})
	response["Content-Security-Policy"] = csp_policy  
	return response

class UploadUserImageView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		user = request.user

		try:
			user_image, created = UserImage.objects.get_or_create(user=user)
			form = UserImageForm(request.POST, request.FILES, instance=user_image)

			if form.is_valid():
				form.save()
				return Response({"message": "Image uploaded successfully", "image_url": user_image.user_avatar.url}, status=status.HTTP_200_OK)

			return Response({"error": form.errors}, status=status.HTTP_400_BAD_REQUEST)
		except (DatabaseError, OperationalError) as e:
			return Response({"server_error": "Database is offline"}, status=503)

class ChangePasswordView(APIView):
	"""
	A view to allow authenticated users to change their password securely.
	"""
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		try:
			user = request.user
			serializer = ChangePasswordSerializer(data=request.data)

			if not serializer.is_valid():
				return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

			current_password = serializer.validated_data['current_password']
			new_password = serializer.validated_data['new_password']
			
			if not user.check_password(current_password):
				return Response({"error": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
			
			try:
				validate_password(new_password, user=user)
			except ValidationError as e:
				return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
			user.set_password(new_password)
			user.save()
		except (DatabaseError, OperationalError) as e:
			return Response({"server_error": "Database is offline"}, status=503)
		return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
	"""
	A view to retrieve the profile of the logged-in user.
	"""
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		"""
		Update the profile of the currently authenticated user.
		"""
		user = request.user
		
		try:
			# Serializing the request data
			serializer = UserProfileSerializer(
				user,
				data=request.data,
				partial=True,
				context={'request': request}
			)

			if serializer.is_valid():
				serializer.save()
				return Response(
					{"message": "Profile updated successfully", "data": serializer.data},
					status=status.HTTP_200_OK,
				)
			return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		except (DatabaseError, OperationalError) as e:
			return Response({"server_error": "Database is offline"}, status=503)

	def get(self, request, *args, **kwargs):
		"""
		Retrieve the profile of the currently authenticated user.
		"""
		try:
			allowed_fields = {'username', 'image_url', 'stat', 'status', 'email', 'friendships', 'history'}
			requested_fields = set(request.query_params.getlist('include'))

			fields = ['id', 'username', 'image_url', 'stat', 'status', 'created_at']
			fields.extend(requested_fields.intersection(allowed_fields))

			user = request.user
			serializer = UserProfileSerializer(user, fields=fields, context={'request': request})

			return Response(serializer.data, status=status.HTTP_200_OK)
		except (DatabaseError, OperationalError) as e:
			return Response({"server_error": "Database is offline"}, status=503)
	
class UsersView(APIView):
	"""
	A view to retrieve user profiles with selected fields.
	"""
	permission_classes = [IsAuthenticated]

	def get(self, request, *args, **kwargs):
		"""
		Retrieve user profiles based on query parameters.
		If no names are provided, return all users.
		"""
		try:
			query_type = request.query_params.get('type', '').lower()
			names = request.query_params.getlist('name')

			if query_type not in {"simple", "full"}:
				return Response(
					{"detail": "Invalid 'type' parameter. Allowed values: 'simple', 'full'."},
					status=status.HTTP_400_BAD_REQUEST
				)

			if names:
				try:
					for name in names:
						validate_slug(name)
				except ValidationError:
					return Response(
						{"detail": "One or more provided usernames are invalid."},
						status=status.HTTP_400_BAD_REQUEST
					)

				users = User.objects.filter(username__in=names)
				if not users.exists():
					return Response(
						{"detail": "No matching users found."},
						status=status.HTTP_404_NOT_FOUND
					)
			else:
				users = User.objects.all()

			if query_type == "simple":
				serializer = SimpleUserProfileSerializer(users, many=True)
			else:
				serializer = UserProfileSerializer(
					users, many=True, context={'request': request},
					fields=['username', 'image_url', 'stat', 'status', 'created_at', 'history']
				)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except (DatabaseError, OperationalError) as e:
			return Response({"server_error": "Database is offline"}, status=503)