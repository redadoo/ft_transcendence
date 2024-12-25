from channels.testing import WebsocketCommunicator
from django.test import TestCase
from liarsbar.consumer import LiarsBarMatchmaking

class LiarsBarMatchmakingTestCase(TestCase):
    async def test_matchmaking(self):
        communicators = [
            WebsocketCommunicator(LiarsBarMatchmaking.as_asgi(), f"ws/multiplayer/pong/matchmaking/{i}")
            for i in range(4)
        ]

        for comm in communicators:
            connected, _ = await comm.connect()
            self.assertTrue(connected)

        for comm in communicators:
            await comm.send_json_to({"action": "join_matchmaking"})

        for comm in communicators:
            response = await comm.receive_json_from()
            self.assertEqual(response["type"], "setup_pong_lobby")
            self.assertIn("room_name", response)

        for comm in communicators:
            await comm.disconnect()
