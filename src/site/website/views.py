from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from website.models import User
from .serializers import UserProfileSerializer, SimpleUserProfileSerializer
from rest_framework.response import Response
from django.middleware.csrf import get_token

def main_page(request, unused_path=None):
	csrf_token = get_token(request)
	return render(request,'main.html', {'csrf_token': csrf_token})

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
				status=200,
			)
		
		return Response({"error": serializer.errors}, status=400)

	def get(self, request, *args, **kwargs):
		"""
		Retrieve the profile of the currently authenticated user.
		"""

		include = request.query_params.getlist('include')
		fields = ['username', 'image_url', 'stat', 'status']
		
		for field in include:
			fields.append(field)

		user = request.user
		serializer = UserProfileSerializer(user, fields=fields,context={'request': request})
		return Response(serializer.data)
	
class UsersView(APIView):
	"""
	A view to retrieve profiles of users with selected fields.
	"""

	permission_classes = [IsAuthenticated]

	def get(self, request, *args, **kwargs):
		"""
		Retrieve user profiles.
		If no name is provided in the query parameters, return all users.
		"""

		query_type = request.query_params.get('type')
		names = request.query_params.getlist('name')
		
		if names:
			users = User.objects.filter(username__in=names)
			if not users.exists():
				return Response({"detail": "No users found for the provided names."}, status=status.HTTP_404_NOT_FOUND)
		else:
			users = User.objects.all()

		if query_type == "simple":
			serializer = SimpleUserProfileSerializer(users, many=True)
		elif query_type == "full":
			fields = ['username', 'image_url', 'stat', 'status', 'created_at', 'history']
			serializer = UserProfileSerializer(users, many=True, fields=fields, context={'request': request})
		else:
			return Response(
				{"detail": "Bad API syntax. Please specify a valid 'type' parameter."},
				status=status.HTTP_400_BAD_REQUEST
			)

		return Response(serializer.data, status=status.HTTP_200_OK)
	
	