from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from core.models import VendorProfile

class OnboardingStatus(models.Model):
    vendor = models.OneToOneField(
        VendorProfile, 
        on_delete=models.CASCADE,
        related_name='onboarding_status'
    )
    current_step = models.CharField(
        max_length=50,
        choices=[
            ('BUSINESS_TYPE', 'Business Type Selection'),
            ('BASIC_INFO', 'Basic Information'),
            ('LEGAL_DETAILS', 'Legal Details'),
            ('KYC_DOCUMENTS', 'KYC Documents'),
            ('BUSINESS_DETAILS', 'Business Details'),
            ('BANK_DETAILS', 'Bank Details'),
            ('REVIEW', 'Review'),
            ('SUBMITTED', 'Submitted'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected'),
        ],
        default='BUSINESS_TYPE'
    )
    completion_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.name} - {self.current_step}"


class LegalDetails(models.Model):
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='legal_details'
    )
    business_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100)
    tax_id = models.CharField(max_length=50)
    business_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    contact_person = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)

    def __str__(self):
        return f"Legal Details - {self.business_name}"


class KYCDocument(models.Model):
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='kyc_documents'
    )
    document_type = models.CharField(
        max_length=50,
        choices=[
            ('ID_PROOF', 'Identity Proof'),
            ('ADDRESS_PROOF', 'Address Proof'),
            ('BUSINESS_LICENSE', 'Business License'),
            ('TAX_CERTIFICATE', 'Tax Certificate'),
            ('BANK_STATEMENT', 'Bank Statement'),
            ('OTHER', 'Other'),
        ]
    )
    document_number = models.CharField(max_length=100)
    document_file = models.FileField(upload_to='kyc_documents/')
    is_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='verified_documents'
    )

    def __str__(self):
        return f"{self.vendor.name} - {self.get_document_type_display()}"


class BankDetails(models.Model):
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='bank_details'
    )
    account_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=255)
    branch_name = models.CharField(max_length=255)
    ifsc_code = models.CharField(max_length=20)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Bank Details - {self.account_name}"


class SportsFacility(models.Model):
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='sports_facility'
    )
    facility_type = ArrayField(
        models.CharField(max_length=100),
        help_text="Types of sports supported"
    )
    total_courts = models.IntegerField(validators=[MinValueValidator(1)])
    amenities = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list
    )
    operating_hours = models.JSONField(
        help_text="Operating hours for each day"
    )
    parking_available = models.BooleanField(default=False)
    has_changing_rooms = models.BooleanField(default=False)
    has_equipment_rental = models.BooleanField(default=False)


class Court(models.Model):
    facility = models.ForeignKey(
        SportsFacility,
        on_delete=models.CASCADE,
        related_name='courts'
    )
    name = models.CharField(max_length=100)
    sport_type = models.CharField(max_length=100)
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    is_indoor = models.BooleanField(default=True)
    dimensions = models.CharField(max_length=50, blank=True)
    surface_type = models.CharField(max_length=100)
    equipment_included = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list
    )


class CoachProfile(models.Model):
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='coach_profile'
    )
    sports = ArrayField(models.CharField(max_length=100))
    experience_years = models.IntegerField(validators=[MinValueValidator(0)])
    qualifications = ArrayField(
        models.CharField(max_length=255),
        blank=True
    )
    certifications = ArrayField(
        models.CharField(max_length=255),
        blank=True
    )
    specializations = ArrayField(
        models.CharField(max_length=100),
        blank=True
    )
    languages = ArrayField(models.CharField(max_length=50))
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    bio = models.TextField()
    profile_image = models.ImageField(
        upload_to='coach_profiles/',
        null=True,
        blank=True
    )


class CoachAvailability(models.Model):
    coach = models.ForeignKey(
        CoachProfile,
        on_delete=models.CASCADE,
        related_name='availability'
    )
    day_of_week = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ['coach', 'day_of_week']


class EcommerceStore(models.Model):
    vendor = models.OneToOneField(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='ecommerce_store'
    )
    store_name = models.CharField(max_length=255)
    description = models.TextField()
    categories = ArrayField(
        models.CharField(max_length=100),
        help_text="Product categories offered"
    )
    shipping_policy = models.TextField(blank=True)
    return_policy = models.TextField(blank=True)
    support_email = models.EmailField()
    support_phone = models.CharField(max_length=20)


class Product(models.Model):
    store = models.ForeignKey(
        EcommerceStore,
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    stock = models.IntegerField(validators=[MinValueValidator(0)])
    sku = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.store.store_name}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='product_images/')
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']