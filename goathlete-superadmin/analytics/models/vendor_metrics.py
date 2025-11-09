from django.db import models
from .models import VendorProfile, Transaction, DailyAnalytics

class VendorPerformanceMetrics(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE)
    date = models.DateField()
    
    # Revenue Metrics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_transaction_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Booking Performance
    total_bookings = models.IntegerField(default=0)
    completed_bookings = models.IntegerField(default=0)
    cancelled_bookings = models.IntegerField(default=0)
    no_show_bookings = models.IntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Customer Metrics
    new_customers = models.IntegerField(default=0)
    repeat_customers = models.IntegerField(default=0)
    customer_retention_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Response Metrics
    average_response_time = models.IntegerField(default=0)  # in minutes
    booking_acceptance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Rating Metrics
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.IntegerField(default=0)
    positive_reviews = models.IntegerField(default=0)
    
    # Offer Performance
    offers_used = models.IntegerField(default=0)
    offer_conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ('vendor', 'date')
        
    def __str__(self):
        return f"{self.vendor.business_name} - {self.date}"