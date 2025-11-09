import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from simple_history.models import HistoricalRecords
from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import RegexValidator


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('VENDOR', 'Vendor'),
        ('CUSTOMER', 'Customer'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    
    # Phone validation: E.164 format (+91XXXXXXXXXX)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+919876543210'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )
    
    first_name = models.CharField(_('first name'), max_length=100)
    last_name = models.CharField(_('last name'), max_length=100)
    avatar_url = models.URLField(_('avatar URL'), max_length=500, null=True, blank=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER', db_index=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False, help_text="Email/Phone verified")
    is_2fa_enabled = models.BooleanField(default=False)
    
    # 2FA secret (should be encrypted at application level)
    _2fa_secret = models.CharField(max_length=255, null=True, blank=True, help_text="TOTP secret for 2FA (encrypted)")
    
    # Account security
    login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True, help_text="Account locked until this time")
    
    # Audit fields
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users_created',
        help_text="User who created this account"
    )
    updated_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users_updated',
        help_text="User who last updated this account"
    )
    
    # Metadata (JSON field for device info, preferences, etc.)
    metadata = models.JSONField(default=dict, blank=True, null=True)
    
    # Timestamps
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['created_at']),
        ]
        permissions = [
            ('can_view_analytics', 'Can view analytics'),
            ('can_manage_vendors', 'Can manage vendors'),
            ('can_manage_offers', 'Can manage offers'),
            ('can_manage_admins', 'Can manage admin users'),
        ]

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def is_locked(self):
        """Check if account is currently locked"""
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        if self.locked_until and timezone.now() >= self.locked_until:
            # Lock expired, reset
            self.locked_until = None
            self.login_attempts = 0
            self.save(update_fields=['locked_until', 'login_attempts'])
        return False

    def increment_login_attempts(self):
        """Increment failed login attempts and lock if threshold reached"""
        self.login_attempts += 1
        if self.login_attempts >= 5:
            from datetime import timedelta
            self.locked_until = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=['login_attempts', 'locked_until'])

    def reset_login_attempts(self):
        """Reset login attempts after successful login"""
        self.login_attempts = 0
        self.locked_until = None
        self.save(update_fields=['login_attempts', 'locked_until'])

    def __str__(self):
        return self.email


class AuditLog(models.Model):
    """Comprehensive audit log for all system actions"""
    ACTION_CHOICES = (
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('OFFER_CREATED', 'Offer Created'),
        ('COMMISSION_UPDATED', 'Commission Updated'),
        ('VENDOR_APPROVED', 'Vendor Approved'),
        ('VENDOR_REJECTED', 'Vendor Rejected'),
        ('BOOKING_CREATED', 'Booking Created'),
        ('BOOKING_CANCELLED', 'Booking Cancelled'),
        ('PAYMENT_PROCESSED', 'Payment Processed'),
    )
    
    STATUS_CHOICES = (
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    entity_type = models.CharField(max_length=100, help_text="Entity type (e.g., 'Vendor', 'Booking', 'Offer')")
    entity_id = models.UUIDField(null=True, blank=True, help_text="ID of the affected entity")
    old_values = models.JSONField(null=True, blank=True, help_text="Values before change")
    new_values = models.JSONField(null=True, blank=True, help_text="Values after change")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='SUCCESS')
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['timestamp']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"{self.get_action_display()} on {self.entity_type} by {self.user} at {self.timestamp}"


class LoginAttempt(models.Model):
    """Track login attempts for security"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_attempt_records',
        null=True,
        blank=True,
        help_text="User attempting to login (null if email not found)"
    )
    email = models.EmailField(help_text="Email used in login attempt")
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(null=True, blank=True)
    success = models.BooleanField(default=False)
    reason_failed = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['email', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['success', 'timestamp']),
        ]

    def __str__(self):
        status = "Success" if self.success else f"Failed: {self.reason_failed}"
        return f"Login attempt for {self.email} - {status} at {self.timestamp}"


# Keep ActivityLog for backward compatibility, but redirect to AuditLog
class ActivityLog(models.Model):
    """Legacy model - use AuditLog instead"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    detail = models.TextField()
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.timestamp}"