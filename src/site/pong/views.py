import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q

@api_view(['GET'])
def start_singleplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
def start_multiplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
def start_multiplayer_pong_game(request):
	# # Fetch lobbies with available slots
	# lobbies = LiarsBarMatch.objects.filter(
	# 	Q(first_user__isnull=True) |
	# 	Q(second_user__isnull=True) |
	# 	Q(third_user__isnull=True) |
	# 	Q(fourth_user__isnull=True)
	# )

	# response_content = {}

	# # If no lobbies are found, create a new one
	# if not lobbies.exists():
	# 	new_match = LiarsBarMatch.objects.create(
	# 		start_date=None,
	# 		end_date=None,
	# 	)
	# 	response_content['first_room_avaible'] = LiarsBarMatchSerializer(new_match).data
	# else:
	# 	# Serialize the first available lobby
	# 	first_lobby = lobbies.first()
	# 	response_content['first_room_avaible'] = LiarsBarMatchSerializer(first_lobby).data

	return Response({})