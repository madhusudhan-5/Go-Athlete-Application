from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class VendorProfile(models.Model):
    VENDOR_TYPES = [
        ('VENUE', 'Venue'),
        ('COACH', 'Coach'),
        ('ECOMMERCE', 'E-commerce')
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    vendor_type = models.CharField(max_length=20, choices=VENDOR_TYPES)
    business_name = models.CharField(max_length=255)
    registration_date = models.DateTimeField(auto_now_add=True)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_date = models.DateTimeField(null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.business_name} ({self.get_vendor_type_display()})"

class Transaction(models.Model):
    PAYMENT_STATUS = [
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed')
    ]
    
    PAYMENT_METHODS = [
        ('RAZORPAY', 'Razorpay'),
        ('OFFLINE', 'Offline')
    ]

    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE)
    booking_id = models.CharField(max_length=100)
    customer_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS)
    created_at = models.DateTimeField(auto_now_add=True)
    service_type = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.booking_id} - {self.vendor.business_name}"

class Offer(models.Model):
    OFFER_TYPES = [
        ('PERCENTAGE', 'Percentage Discount'),
        ('FIXED', 'Fixed Amount'),
        ('CASHBACK', 'Cashback')
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    offer_type = models.CharField(max_length=20, choices=OFFER_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_purchase = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    max_uses = models.IntegerField(null=True, blank=True)
    total_uses = models.IntegerField(default=0)
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.get_offer_type_display()}"

class OfferUsage(models.Model):
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.offer.code} used in {self.transaction.booking_id}"

class DailyAnalytics(models.Model):
    date = models.DateField(unique=True)
    # Revenue Metrics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_vendor_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    online_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    offline_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Booking Metrics
    total_bookings = models.IntegerField(default=0)
    completed_bookings = models.IntegerField(default=0)
    cancelled_bookings = models.IntegerField(default=0)
    average_booking_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Customer Metrics
    new_customers = models.IntegerField(default=0)
    repeat_customers = models.IntegerField(default=0)
    total_unique_customers = models.IntegerField(default=0)
    
    # Offer Metrics
    total_offers_used = models.IntegerField(default=0)
    total_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    offer_success_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    
    # Time Metrics
    peak_hour_bookings = models.IntegerField(default=0)
    peak_hour = models.IntegerField(null=True, blank=True)  # 0-23 hour format
    off_peak_bookings = models.IntegerField(default=0)
    
    # Performance Metrics
    average_response_time = models.IntegerField(default=0)  # in seconds
    vendor_satisfaction_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    customer_satisfaction_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Daily Analytics"

    def __str__(self):
        return f"Analytics for {self.date}"

class CategoryAnalytics(models.Model):
    date = models.DateField()
    vendor_type = models.CharField(max_length=20, choices=VendorProfile.VENDOR_TYPES)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_bookings = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('date', 'vendor_type')
        verbose_name_plural = "Category Analytics"

    def __str__(self):
        return f"{self.get_vendor_type_display()} Analytics for {self.date}"