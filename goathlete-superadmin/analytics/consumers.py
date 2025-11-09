from channels.generic.websocket import AsyncWebsocketConsumer
import json

class AnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Add the channel to the analytics updates group
        await self.channel_layer.group_add(
            "analytics_updates",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove the channel from the group
        await self.channel_layer.group_discard(
            "analytics_updates",
            self.channel_name
        )

    async def analytics_update(self, event):
        # Send analytics update to WebSocket
        await self.send(text_data=json.dumps(event["message"]))