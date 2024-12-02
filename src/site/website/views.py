from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.viewsets import ViewSet
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer
from rest_framework.response import Response
from rest_framework.decorators import action

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
		serializer = UserProfileSerializer(user, fields=fields)
		return Response(serializer.data)