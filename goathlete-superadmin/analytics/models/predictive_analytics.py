from django.db import models
from django.contrib.postgres.fields import ArrayField
from .models import VendorProfile, Transaction

class SeasonalityAnalytics(models.Model):
    SEASONALITY_TYPE = [
        ('DAILY', 'Daily Pattern'),
        ('WEEKLY', 'Weekly Pattern'),
        ('MONTHLY', 'Monthly Pattern'),
        ('YEARLY', 'Yearly Pattern')
    ]

    analysis_type = models.CharField(max_length=10, choices=SEASONALITY_TYPE)
    vendor_type = models.CharField(max_length=20, choices=VendorProfile.VENDOR_TYPES)
    pattern_data = ArrayField(
        models.FloatField(),
        help_text="Array of values representing the pattern"
    )
    confidence_score = models.FloatField(
        help_text="Confidence level of the pattern (0-1)"
    )
    peak_periods = ArrayField(
        models.IntegerField(),
        help_text="Array of peak period indices"
    )
    low_periods = ArrayField(
        models.IntegerField(),
        help_text="Array of low period indices"
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('analysis_type', 'vendor_type')

class CustomerLifetimeValue(models.Model):
    customer_id = models.CharField(max_length=100, unique=True)
    first_booking_date = models.DateTimeField()
    total_bookings = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_booking_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    frequency = models.FloatField(help_text="Average bookings per month")
    recency = models.IntegerField(help_text="Days since last booking")
    predicted_clv = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    churn_probability = models.FloatField(default=0)
    segment = models.CharField(max_length=20, default='NEW')
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CLV for Customer {self.customer_id}"

class PredictiveMetrics(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE)
    date = models.DateField()
    
    # Revenue Predictions
    predicted_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    revenue_confidence = models.FloatField()
    
    # Booking Predictions
    predicted_bookings = models.IntegerField()
    booking_confidence = models.FloatField()
    
    # Demand Forecasting
    peak_hours = ArrayField(
        models.IntegerField(),
        help_text="Predicted peak hours (0-23)"
    )
    demand_by_hour = ArrayField(
        models.FloatField(),
        help_text="Predicted demand score for each hour"
    )
    
    # Pricing Recommendations
    recommended_base_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_confidence = models.FloatField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('vendor', 'date')

    def __str__(self):
        return f"Predictions for {self.vendor.business_name} on {self.date}"