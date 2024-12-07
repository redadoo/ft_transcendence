import uuid
from .models import *
from .serializers import *
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import api_view

# Create your views here.

@api_view(['GET'])
def start_multiplayer_liarsbar_game(request):
	# Fetch lobbies with available slots
	lobbies = LiarsBarMatch.objects.filter(
		Q(first_user__isnull=True) |
		Q(second_user__isnull=True) |
		Q(third_user__isnull=True) |
		Q(fourth_user__isnull=True)
	)

	response_content = {}

	# If no lobbies are found, create a new one
	if not lobbies.exists():
		new_match = LiarsBarMatch.objects.create(
			start_date=None,
			end_date=None,
		)
		response_content['first_room_avaible'] = LiarsBarMatchSerializer(new_match).data
	else:
		# Serialize the first available lobby
		first_lobby = lobbies.first()
		response_content['first_room_avaible'] = LiarsBarMatchSerializer(first_lobby).data

	return Response(response_content)



@api_view(['GET'])
def get_liarsbar_match_details(request, match_id):
	try:
		match = LiarsBarMatch.objects.get(id=match_id)
	except LiarsBarMatch.DoesNotExist:
		return Response({"error": "Match not found"}, status=404)

	# Serialize the match instance
	serializer = LiarsBarMatchSerializer(match)

	# Return serialized data in the response
	return Response(serializer.data)