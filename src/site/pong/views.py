import uuid
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
def start_singleplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
def start_multiplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})