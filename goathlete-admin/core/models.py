import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from simple_history.models import HistoricalRecords
from django.contrib.postgres.fields import ArrayField


class AdminHierarchy(models.Model):
    """Admin hierarchy - Super Admin assigns Admins with specific permissions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='admin_hierarchy',
        limit_choices_to={'role': 'ADMIN'}
    )
    super_admin_user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='managed_admins',
        limit_choices_to={'role': 'SUPER_ADMIN'}
    )
    vendor_access = models.JSONField(
        default=list,
        help_text="Array of vendor IDs allowed to manage, or ['ALL'] for all vendors"
    )
    permissions = models.JSONField(
        default=dict,
        help_text="JSON: can_onboard_vendor, can_manage_customers, can_view_analytics, can_moderate_offers"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_assignments'
    )

    class Meta:
        unique_together = ['admin_user', 'super_admin_user']
        verbose_name_plural = 'Admin Hierarchies'

    def __str__(self):
        return f"{self.admin_user.email} managed by {self.super_admin_user.email}"


class CommissionConfig(models.Model):
    """Commission configuration for Super Admin"""
    PAYOUT_CYCLE_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    super_admin = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='commission_configs',
        limit_choices_to={'role': 'SUPER_ADMIN'}
    )
    default_commission_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=20.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Default commission percentage"
    )
    category_overrides = models.JSONField(
        default=dict,
        help_text="JSON: {'VENUE': 18.0, 'COACH': 22.0, 'ECOMMERCE': 20.0}"
    )
    vendor_custom_rates = models.JSONField(
        default=dict,
        help_text="JSON: {vendor_id: rate, ...}"
    )
    payout_cycle = models.CharField(
        max_length=10,
        choices=PAYOUT_CYCLE_CHOICES,
        default='WEEKLY'
    )
    minimum_payout_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=5000.00,
        validators=[MinValueValidator(0)]
    )
    tax_rate_gst = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        default=18.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commission Configuration'
        verbose_name_plural = 'Commission Configurations'

    def __str__(self):
        return f"Commission Config - {self.default_commission_percentage}% (effective from {self.created_at})"


class Offer(models.Model):
    """Comprehensive offer model with visibility percentage and usage limits"""
    OFFER_TYPES = (
        ('INITIAL', 'Initial Offer'),
        ('FESTIVE', 'Festive Offer'),
        ('REFERRAL', 'Referral Offer'),
        ('GENERAL', 'General Offer'),
        ('CUSTOM', 'Custom Offer'),
    )
    
    DISCOUNT_TYPES = (
        ('PERCENTAGE', 'Percentage'),
        ('FLAT_AMOUNT', 'Flat Amount'),
        ('BUY_X_GET_Y', 'Buy X Get Y'),
        ('FREE_SHIPPING', 'Free Shipping'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='offers_created',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    offer_type = models.CharField(max_length=20, choices=OFFER_TYPES, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Discount value (percentage or amount)"
    )
    max_discount_cap = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Maximum discount cap for percentage discounts"
    )
    minimum_booking_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    applicable_categories = models.JSONField(
        default=list,
        help_text="Array: ['VENUE', 'COACH', 'ECOMMERCE']"
    )
    applicable_vendor_ids = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="Array of vendor IDs, or null for all vendors"
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    applicable_days_of_week = models.JSONField(
        default=list,
        help_text="Array: [0,1,2,3,4,5,6] for Monday-Sunday"
    )
    usage_limit_total = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Total redemptions allowed"
    )
    usage_limit_per_customer = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Per customer max uses"
    )
    exclude_customer_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of customer IDs to exclude"
    )
    include_customer_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of customer IDs to include (if specified, only these customers)"
    )
    is_active = models.BooleanField(default=True, db_index=True)
    visibility_percentage = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Show only top X% of offers (10/20/30)"
    )
    redemption_count = models.IntegerField(
        default=0,
        help_text="Current redemptions (denormalized)"
    )
    revenue_impact = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total revenue impact (denormalized)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Soft delete")
    
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'start_date', 'end_date']),
            models.Index(fields=['offer_type', 'is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_offer_type_display()})"


class VendorProfile(models.Model):
    """Comprehensive Vendor model matching FSD specification"""
    VENDOR_TYPES = (
        ('VENUE', 'Venue'),
        ('COACH', 'Coach'),
        ('ECOMMERCE', 'Ecommerce'),
        ('HYBRID', 'Hybrid'),
    )
    
    KYC_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    )
    
    APPROVAL_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    )
    
    PAYOUT_FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    )
    
    ACCOUNT_TYPE_CHOICES = (
        ('SAVINGS', 'Savings'),
        ('CURRENT', 'Current'),
    )
    
    # PAN validation regex
    pan_regex = RegexValidator(
        regex=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
        message="PAN must be in format: ABCDE1234F"
    )
    
    # GSTIN validation regex
    gstin_regex = RegexValidator(
        regex=r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
        message="GSTIN must be in format: 07AABCU9603R1Z0"
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='vendor_profile',
        limit_choices_to={'role': 'VENDOR'}
    )
    vendor_type = models.CharField(max_length=20, choices=VENDOR_TYPES, db_index=True)
    business_name = models.CharField(max_length=200)
    legal_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, max_length=5000)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    banner_url = models.URLField(max_length=500, blank=True, null=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=17)  # E.164 format
    website = models.URLField(blank=True, null=True)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, default='IN')
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # KYC
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='PENDING', db_index=True)
    kyc_document_url = models.URLField(max_length=500, blank=True, null=True)
    kyc_verified_at = models.DateTimeField(null=True, blank=True)
    kyc_verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_verified_vendors',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    
    # Legal & Tax
    pan_number = models.CharField(max_length=10, validators=[pan_regex])
    gstin = models.CharField(max_length=15, validators=[gstin_regex], blank=True, null=True)
    
    # Bank Details
    bank_account_holder = models.CharField(max_length=200)
    bank_name = models.CharField(max_length=200)
    account_number = models.CharField(max_length=50)  # Should be encrypted in production
    ifsc_code = models.CharField(max_length=11)
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPE_CHOICES)
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Commission & Payout
    payout_frequency = models.CharField(max_length=10, choices=PAYOUT_FREQUENCY_CHOICES, default='WEEKLY')
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    custom_commission = models.BooleanField(default=False, help_text="If Super Admin allows per-vendor override")
    
    # Approval
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='PENDING', db_index=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_vendors',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    onboarded_at = models.DateTimeField(auto_now_add=True)
    onboarded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='onboarded_vendors',
        limit_choices_to={'role__in': ['SUPER_ADMIN', 'ADMIN']}
    )
    is_active = models.BooleanField(default=True, db_index=True)
    suspension_reason = models.TextField(blank=True, null=True)
    
    # Analytics (denormalized)
    staff_count = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    total_ratings = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Soft delete")
    
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor_type', 'approval_status']),
            models.Index(fields=['city', 'approval_status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['kyc_status', 'approval_status']),
        ]

    def __str__(self):
        return f"{self.business_name} ({self.get_vendor_type_display()})"


class VendorStaff(models.Model):
    """Vendor's internal staff members"""
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
        ('ACCOUNTANT', 'Accountant'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='staff_members')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='vendor_staff_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    permissions = models.JSONField(
        default=dict,
        help_text="JSON: can_create_bookings, can_edit_pricing, can_view_reports, can_manage_staff"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_assignments'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['vendor', 'user']
        verbose_name_plural = 'Vendor Staff'

    def __str__(self):
        return f"{self.user.email} - {self.role} at {self.vendor.business_name}"


class Analytics(models.Model):
    date = models.DateField()
    total_bookings = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor_type = models.CharField(max_length=20, choices=VendorProfile.VENDOR_TYPES)
    
    class Meta:
        verbose_name_plural = "Analytics"
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date', 'vendor_type']),
        ]

    def __str__(self):
        return f"Analytics for {self.get_vendor_type_display()} on {self.date}"