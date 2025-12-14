from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/notifications/vendor/(?P<vendor_id>\d+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/admin/$', consumers.AdminNotificationConsumer.as_asgi()),
]
