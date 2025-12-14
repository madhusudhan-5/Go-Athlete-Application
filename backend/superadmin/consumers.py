import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.vendor_id = self.scope.get("url_route", {}).get("kwargs", {}).get("vendor_id")
        
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return
        
        if self.vendor_id:
            self.room_group_name = f"vendor_{self.vendor_id}"
        else:
            self.room_group_name = "global_notifications"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected: {self.room_group_name}")
        
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to notification stream",
            "room": self.room_group_name
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected: {self.room_group_name}")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "message")
            
            if message_type == "ping":
                await self.send(text_data=json.dumps({
                    "type": "pong",
                    "timestamp": data.get("timestamp")
                }))
            elif message_type == "subscribe":
                topic = data.get("topic")
                if topic:
                    await self.channel_layer.group_add(topic, self.channel_name)
                    await self.send(text_data=json.dumps({
                        "type": "subscribed",
                        "topic": topic
                    }))
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
    
    async def notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": event.get("data", {}),
            "timestamp": event.get("timestamp")
        }))
    
    async def booking_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "booking_update",
            "booking": event.get("booking", {}),
            "action": event.get("action"),
            "timestamp": event.get("timestamp")
        }))
    
    async def payout_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "payout_update",
            "payout": event.get("payout", {}),
            "status": event.get("status"),
            "timestamp": event.get("timestamp")
        }))


class AdminNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        if not self.user or not self.user.is_authenticated or not self.user.is_staff:
            await self.close(code=4001)
            return
        
        self.room_group_name = "admin_notifications"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to admin notification stream"
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("type") == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
        except json.JSONDecodeError:
            pass
    
    async def vendor_pending(self, event):
        await self.send(text_data=json.dumps({
            "type": "vendor_pending",
            "vendor": event.get("vendor", {}),
            "timestamp": event.get("timestamp")
        }))
    
    async def kyc_submitted(self, event):
        await self.send(text_data=json.dumps({
            "type": "kyc_submitted",
            "kyc": event.get("kyc", {}),
            "timestamp": event.get("timestamp")
        }))
    
    async def ticket_created(self, event):
        await self.send(text_data=json.dumps({
            "type": "ticket_created",
            "ticket": event.get("ticket", {}),
            "timestamp": event.get("timestamp")
        }))
