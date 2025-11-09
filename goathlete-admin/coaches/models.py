import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from simple_history.models import HistoricalRecords


class Coach(models.Model):
    """Coach model for professional coaching profiles"""
    VERIFICATION_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        'core.VendorProfile',
        on_delete=models.CASCADE,
        related_name='coaches',
        limit_choices_to={'vendor_type__in': ['COACH', 'HYBRID']}
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='coach_profile',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True, max_length=1000)
    profile_image = models.URLField(max_length=500, blank=True, null=True)
    specializations = models.JSONField(default=list, help_text="Array: ['Cricket - Batting', 'Fitness', ...]")
    years_of_experience = models.IntegerField(validators=[MinValueValidator(0)])
    certifications = models.JSONField(
        default=list,
        help_text="Array: [{name, issuer, number, doc_url}, ...]"
    )
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='PENDING', db_index=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_coaches',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    available_for_online = models.BooleanField(default=False)
    available_for_venue = models.BooleanField(default=False)
    available_for_home = models.BooleanField(default=False)
    max_home_travel_km = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    home_visit_extra_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    max_clients_per_session = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    cancellation_policy = models.TextField(blank=True, null=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    total_ratings = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0, help_text="Denormalized count")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['verification_status', 'is_active']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.vendor.business_name}"


class CoachAvailability(models.Model):
    """Weekly availability schedule for coaches"""
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
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    recurring = models.BooleanField(default=True, help_text="Weekly repeat")
    lead_time_hours = models.IntegerField(
        default=6,
        validators=[MinValueValidator(0)],
        help_text="Minimum hours before booking"
    )

    class Meta:
        unique_together = ['coach', 'day_of_week']
        verbose_name_plural = 'Coach Availabilities'

    def __str__(self):
        return f"{self.coach.first_name} {self.coach.last_name} - {self.get_day_of_week_display()}"


class CoachPackage(models.Model):
    """Bundled session packages for coaches"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=200, help_text="e.g., '10-Session Package'")
    description = models.TextField(blank=True, null=True)
    sessions_count = models.IntegerField(validators=[MinValueValidator(1)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    validity_days = models.IntegerField(validators=[MinValueValidator(1)], help_text="e.g., 90")
    discount_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount vs. per-session rate"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['coach', 'sessions_count']

    def __str__(self):
        return f"{self.name} - {self.coach.first_name} {self.coach.last_name}"

