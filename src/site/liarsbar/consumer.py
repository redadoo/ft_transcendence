from channels.generic.websocket import AsyncWebsocketConsumer


class  liarsBarConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        print("connetct")
        pass


    async def disconnect(self, close_code):
        print("disconnect")
        pass
