import uuid
from rest_framework.response import Response
from rest_framework.decorators import api_view

# Create your views here.

@api_view(['GET'])
def start_singleplayer_liarsbar_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})