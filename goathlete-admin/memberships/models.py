import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Membership(models.Model):
    """Membership plans for vendors"""
    MEMBERSHIP_TYPE_CHOICES = (
        ('SESSION_BASED', 'Session Based'),
        ('CREDIT_BASED', 'Credit Based'),
        ('UNLIMITED', 'Unlimited'),
        ('TIME_BASED', 'Time Based'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey('core.VendorProfile', on_delete=models.CASCADE, related_name='memberships')
    name = models.CharField(max_length=200, help_text="e.g., 'Monthly Court Pass'")
    description = models.TextField(blank=True, null=True)
    membership_type = models.CharField(max_length=20, choices=MEMBERSHIP_TYPE_CHOICES)
    sessions_count = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="If SESSION_BASED"
    )
    credits_count = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="If CREDIT_BASED"
    )
    validity_days = models.IntegerField(validators=[MinValueValidator(1)], help_text="e.g., 30")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    renewal_reminder_days = models.IntegerField(
        default=3,
        validators=[MinValueValidator(0)],
        help_text="Days before expiry to send reminder"
    )
    auto_renew = models.BooleanField(default=False)
    discount_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount vs. per-session/use rate"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['vendor', 'name']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.vendor.business_name}"


class CustomerMembership(models.Model):
    """Active customer memberships"""
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('FROZEN', 'Frozen'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='memberships',
        limit_choices_to={'role': 'CUSTOMER'}
    )
    membership = models.ForeignKey(Membership, on_delete=models.PROTECT, related_name='customer_memberships')
    start_date = models.DateField()
    end_date = models.DateField()
    sessions_used = models.IntegerField(default=0, help_text="Denormalized")
    credits_used = models.IntegerField(default=0, help_text="Denormalized")
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', db_index=True)
    renewal_last_notified = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_user', 'status']),
            models.Index(fields=['membership', 'status']),
            models.Index(fields=['end_date', 'status']),
        ]

    def __str__(self):
        return f"{self.customer_user.email} - {self.membership.name}"

