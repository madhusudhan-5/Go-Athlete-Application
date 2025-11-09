from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Transaction, DailyAnalytics, VendorProfile
from .models.vendor_metrics import VendorPerformanceMetrics
from datetime import datetime
import json

@receiver(post_save, sender=Transaction)
def update_analytics(sender, instance, created, **kwargs):
    if not created:
        return

    date = instance.created_at.date()
    
    # Update daily analytics
    analytics, _ = DailyAnalytics.objects.get_or_create(date=date)
    
    # Update revenue metrics
    if instance.payment_status == 'COMPLETED':
        analytics.total_revenue += instance.amount
        analytics.total_commission += instance.commission_amount
        analytics.net_vendor_earnings += instance.net_amount
        
        if instance.payment_method == 'ONLINE':
            analytics.online_revenue += instance.amount
        else:
            analytics.offline_revenue += instance.amount
    
    analytics.total_bookings += 1
    analytics.save()
    
    # Update vendor performance metrics
    vendor_metrics, _ = VendorPerformanceMetrics.objects.get_or_create(
        vendor=instance.vendor,
        date=date
    )
    
    vendor_metrics.total_bookings += 1
    vendor_metrics.total_revenue += instance.amount
    vendor_metrics.net_revenue += instance.net_amount
    vendor_metrics.commission_paid += instance.commission_amount
    
    # Update averages
    total_transactions = Transaction.objects.filter(
        vendor=instance.vendor,
        created_at__date=date
    ).count()
    
    vendor_metrics.average_transaction_value = (
        vendor_metrics.total_revenue / total_transactions
    )
    
    vendor_metrics.save()
    
    # Send real-time update via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "analytics_updates",
        {
            "type": "analytics_update",
            "message": {
                "date": date.isoformat(),
                "total_revenue": float(analytics.total_revenue),
                "total_bookings": analytics.total_bookings,
                "vendor_id": instance.vendor.id,
                "vendor_revenue": float(vendor_metrics.total_revenue)
            }
        }
    )