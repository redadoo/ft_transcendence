import uuid
import asyncio
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from channels.layers import get_channel_layer

@api_view(['GET'])
def start_singleplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})

@api_view(['GET'])
def start_multiplayer_pong_game(request):
	room_name = str(uuid.uuid4())
	return Response({'room_name' : room_name})


class StartGameAPI(APIView):
	def post(self, request, room_name):
		"""
		Start the game via API.
		"""
		channel_layer = get_channel_layer()
		event_data = {
			"type": "external_start_game",
			"message": "Start game command received from API.",
		}

		# Send a message to the WebSocket group
		asyncio.run(channel_layer.group_send(f"pong_singleplayer_{room_name}", event_data))


class UpdatePlayerAPI(APIView):
	def post(self, request, room_name, player_id):
		player_data = request.data.get("player_data", {})
		channel_layer = get_channel_layer()
		event_data = {
			"type": "external_update_player",
			"player_id": player_id,
			"player_data": player_data,
		}
		asyncio.run(channel_layer.group_send(f"pong_singleplayer_{room_name}", event_data))
		return Response({"status": "Player update sent"})