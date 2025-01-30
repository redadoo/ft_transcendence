import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import *
from .serializers import *

# @api_view(['GET'])
# def start_singleplayer_pong_game(request):
# 	room_name = str(uuid.uuid4())
# 	return Response({'room_name' : room_name})

# @api_view(['GET'])
# def start_multiplayer_pong_game(request):
# 	room_name = str(uuid.uuid4())
# 	return Response({'room_name' : room_name})

# def start_tournament_pong(request):
# 	tournament_code = str(uuid.uuid4())
# 	return Response({'tournament_code' : tournament_code})

# def join_pong_tournament(request):
# 	tournament_code = request.GET.get('tournament_code')
# 	return Response({'tournament_code' : tournament_code})

# def start_pong_tournament_match(request):
# 	tournament_code = request.GET.get('tournament_code')
# 	return Response({'tournament_code' : tournament_code})

# def get_match_winner(request):
# 	tournament_code = request.GET.get('tournament_code')
# 	return Response({'tournament_code' : tournament_code})