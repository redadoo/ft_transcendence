from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from website.models import User
from .serializers import UserProfileSerializer, SimpleUserProfileSerializer
from rest_framework.response import Response

# TODO change view from APIView to ViewSet

def main_page(request, unused_path=None):
	return render(request,'main.html')

class UserProfileView(APIView):
	"""
	A view to retrieve the profile of the logged-in user.
	"""

	permission_classes = [IsAuthenticated]

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

		names = request.query_params.getlist('name')
		
		if names:
			users = User.objects.filter(username__in=names)
			if not users.exists():
				return Response(
					{"detail": "No users found for the provided names."}, 
					status=status.HTTP_404_NOT_FOUND
				)
		else:
			users = User.objects.all()
		
		serializer = SimpleUserProfileSerializer(users, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)
	
	