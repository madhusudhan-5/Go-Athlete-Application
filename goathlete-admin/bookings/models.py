import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from simple_history.models import HistoricalRecords


class Booking(models.Model):
    """Booking model for venue/court reservations"""
    PAYMENT_METHOD_CHOICES = (
        ('ONLINE', 'Online'),
        ('CASH', 'Cash'),
        ('WALLET', 'Wallet'),
        ('UPI', 'UPI'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    BOOKING_STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
    )

    REFUND_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('FAILED', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    court = models.ForeignKey('venues.Court', on_delete=models.PROTECT, related_name='bookings')
    customer_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='bookings',
        limit_choices_to={'role': 'CUSTOMER'},
        null=True,
        blank=True
    )
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=17)  # E.164 format
    customer_email = models.EmailField()
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    applied_offer = models.ForeignKey(
        'core.Offer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )
    taxable_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    tax_percentage = models.DecimalField(max_digits=4, decimal_places=1, default=18.0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Commission
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    vendor_payout = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Payment
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)
    payment_id = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay payment ID")
    
    # Status
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='CONFIRMED', db_index=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    # Refund
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, null=True, blank=True)
    
    # Notes
    internal_notes = models.TextField(blank=True, null=True, help_text="Vendor notes, not visible to customer")
    customer_notes = models.TextField(blank=True, null=True, help_text="Customer special requests")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings_created'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['court', 'date', 'booking_status']),
            models.Index(fields=['customer_user', 'date']),
            models.Index(fields=['payment_status', 'booking_status']),
            models.Index(fields=['date', 'start_time']),
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.court.name} on {self.date}"

    def calculate_totals(self):
        """Calculate all pricing components"""
        # Taxable amount = base_price - discount
        self.taxable_amount = self.base_price - self.discount_amount
        # Tax = taxable_amount * (tax_percentage / 100)
        self.tax_amount = self.taxable_amount * (self.tax_percentage / 100)
        # Total = taxable + tax
        self.total_amount = self.taxable_amount + self.tax_amount
        # Commission = total * (commission_percentage / 100)
        self.commission_amount = self.total_amount * (self.commission_percentage / 100)
        # Vendor payout = total - commission
        self.vendor_payout = self.total_amount - self.commission_amount
        return self


class Order(models.Model):
    """Order model for ecommerce purchases"""
    PAYMENT_METHOD_CHOICES = (
        ('ONLINE', 'Online'),
        ('COD', 'Cash on Delivery'),
        ('WALLET', 'Wallet'),
        ('UPI', 'UPI'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    ORDER_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'),
    )

    FULFILLMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
    )

    REFUND_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSED', 'Processed'),
        ('FAILED', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey('core.VendorProfile', on_delete=models.PROTECT, related_name='orders')
    customer_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='orders',
        limit_choices_to={'role': 'CUSTOMER'}
    )
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    items = models.JSONField(help_text="Array: [{product_id, variant_id, quantity, price}, ...]")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    applied_offer = models.ForeignKey(
        'core.Offer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    vendor_payout = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)
    payment_id = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay payment ID")
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='PENDING', db_index=True)
    shipping_address = models.JSONField(help_text="JSON: {name, phone, address, city, state, postal_code}")
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    tracking_url = models.URLField(max_length=500, blank=True, null=True)
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    fulfillment_status = models.CharField(max_length=20, choices=FULFILLMENT_STATUS_CHOICES, default='PENDING')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'order_status']),
            models.Index(fields=['customer_user', 'order_status']),
            models.Index(fields=['payment_status', 'order_status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.vendor.business_name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number: ORD-YYYYMMDD-XXXX
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            last_order = Order.objects.filter(order_number__startswith=f'ORD-{date_str}').order_by('-order_number').first()
            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            self.order_number = f'ORD-{date_str}-{new_num:04d}'
        super().save(*args, **kwargs)


class CoachingSession(models.Model):
    """Coaching session booking model"""
    DELIVERY_MODE_CHOICES = (
        ('ONLINE', 'Online'),
        ('VENUE', 'Venue'),
        ('HOME', 'Home'),
        ('HYBRID', 'Hybrid'),
    )

    ATTENDANCE_STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW', 'No Show'),
        ('CANCELLED', 'Cancelled'),
    )

    PAYMENT_METHOD_CHOICES = Booking.PAYMENT_METHOD_CHOICES
    PAYMENT_STATUS_CHOICES = Booking.PAYMENT_STATUS_CHOICES
    REFUND_STATUS_CHOICES = Booking.REFUND_STATUS_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey('coaches.Coach', on_delete=models.PROTECT, related_name='sessions')
    customer_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='coaching_sessions',
        limit_choices_to={'role': 'CUSTOMER'}
    )
    session_type = models.CharField(max_length=200, help_text="e.g., '1-on-1 Cricket Batting'")
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    delivery_mode = models.CharField(max_length=10, choices=DELIVERY_MODE_CHOICES)
    meeting_link = models.URLField(max_length=500, blank=True, null=True, help_text="Zoom/Teams URL if online")
    location_address = models.CharField(max_length=500, blank=True, null=True, help_text="If home or venue")
    
    # Pricing (same as Booking)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    applied_offer = models.ForeignKey(
        'core.Offer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coaching_sessions'
    )
    taxable_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    tax_percentage = models.DecimalField(max_digits=4, decimal_places=1, default=18.0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    vendor_payout = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Payment
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING', db_index=True)
    payment_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Session specific
    attendance_status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES, default='NOT_STARTED')
    feedback_rating = models.DecimalField(max_digits=2, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    feedback_comment = models.TextField(blank=True, null=True)
    
    # Refund
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['coach', 'date']),
            models.Index(fields=['customer_user', 'date']),
            models.Index(fields=['attendance_status']),
        ]

    def __str__(self):
        return f"Session {self.id} - {self.coach.first_name} {self.coach.last_name} on {self.date}"
