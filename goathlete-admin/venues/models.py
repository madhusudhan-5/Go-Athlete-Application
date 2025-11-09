import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from simple_history.models import HistoricalRecords


class Venue(models.Model):
    """Venue model for sports facilities"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        'core.VendorProfile',
        on_delete=models.CASCADE,
        related_name='venues',
        limit_choices_to={'vendor_type__in': ['VENUE', 'HYBRID']}
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    phone_number = models.CharField(max_length=17)  # E.164 format
    images = models.JSONField(default=list, help_text="Array of image URLs, max 10")
    amenities = models.JSONField(default=list, help_text="Array: ['WiFi', 'Parking', 'Cafeteria', ...]")
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_open_24_7 = models.BooleanField(default=False)
    holiday_dates = models.JSONField(default=list, help_text="Array: ['2025-12-25', '2025-01-26', ...]")
    cancellation_window_hours = models.IntegerField(default=24, validators=[MinValueValidator(0)])
    reschedule_window_hours = models.IntegerField(default=48, validators=[MinValueValidator(0)])
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_venues',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['is_verified', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.vendor.business_name}"


class Court(models.Model):
    """Court model for individual sports courts/fields"""
    COURT_TYPE_CHOICES = (
        ('CRICKET', 'Cricket'),
        ('BADMINTON', 'Badminton'),
        ('TENNIS', 'Tennis'),
        ('BASKETBALL', 'Basketball'),
        ('VOLLEYBALL', 'Volleyball'),
        ('FOOTBALL', 'Football'),
        ('TABLE_TENNIS', 'Table Tennis'),
        ('SWIMMING', 'Swimming'),
        ('GYM', 'Gym'),
        ('YOGA', 'Yoga'),
        ('OTHER', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='courts')
    name = models.CharField(max_length=100)
    court_type = models.CharField(max_length=20, choices=COURT_TYPE_CHOICES, db_index=True)
    base_price_per_hour = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(max_length=3, default='INR')
    surface_type = models.CharField(max_length=100, blank=True, null=True)
    capacity = models.IntegerField(validators=[MinValueValidator(1)], help_text="Max players")
    lights_available = models.BooleanField(default=False)
    equipment_available = models.JSONField(default=list, help_text="Array: ['Stumps', 'Bats', 'Balls', ...]")
    images = models.JSONField(default=list, help_text="Array of image URLs, max 10")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['venue', 'name']
        indexes = [
            models.Index(fields=['venue', 'is_active']),
            models.Index(fields=['court_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_court_type_display()}) - {self.venue.name}"


class CourtAvailability(models.Model):
    """Weekly availability schedule for courts"""
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ['court', 'day_of_week']
        verbose_name_plural = 'Court Availabilities'

    def __str__(self):
        return f"{self.court.name} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"


class TimeSlot(models.Model):
    """Individual bookable time slots for courts"""
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('BOOKED', 'Booked'),
        ('BLOCKED', 'Blocked'),
        ('MAINTENANCE', 'Maintenance'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='time_slots')
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    base_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    booked_by = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='time_slots'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['court', 'date', 'status']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['status', 'date']),
        ]
        unique_together = ['court', 'date', 'start_time', 'end_time']

    def __str__(self):
        return f"{self.court.name} - {self.date} {self.start_time}-{self.end_time} ({self.status})"

