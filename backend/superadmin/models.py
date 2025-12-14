from django.db import models

class GlobalConfig(models.Model):
    PAYOUT_CYCLE_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]
    
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    payout_cycle = models.CharField(max_length=20, choices=PAYOUT_CYCLE_CHOICES, default='WEEKLY')
    min_payout_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    booking_cancellation_window_hours = models.IntegerField(default=24)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Global Config (Commission: {self.commission_percentage}%)"

    class Meta:
        verbose_name = 'Global Configuration'
        verbose_name_plural = 'Global Configuration'

    @classmethod
    def get_config(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config


class Offer(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('DISABLED', 'Disabled'),
    ]

    TYPE_CHOICES = [
        ('FLAT', 'Flat Amount'),
        ('PERCENT', 'Percentage'),
    ]

    SCOPE_CHOICES = [
        ('ALL_VENDORS', 'All Vendors'),
        ('SELECTED_VENDORS', 'Selected Vendors'),
        ('ALL_SPORTS', 'All Sports'),
        ('SELECTED_SPORTS', 'Selected Sports'),
        ('ALL_VENUES', 'All Venues'),
        ('SELECTED_VENUES', 'Selected Venues'),
    ]

    OFFER_CATEGORY_CHOICES = [
        ('COURT_BOOKING', 'Court Booking'),
        ('COACHING', 'Coaching'),
        ('MEMBERSHIP', 'Membership'),
        ('ECOMMERCE', 'Ecommerce'),
        ('ALL', 'All Services'),
    ]

    title = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    description = models.TextField(blank=True)
    offer_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PERCENT')
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    applicable_scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='ALL_VENDORS')
    applicable_categories = models.JSONField(default=list)
    offer_category = models.CharField(max_length=20, choices=OFFER_CATEGORY_CHOICES, default='ALL')
    visibility_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100.00,
        help_text="Percentage of users who can see this offer (0-100)")
    max_usage_count = models.PositiveIntegerField(default=0, help_text="Maximum total uses (0=unlimited)")
    usage_count = models.PositiveIntegerField(default=0, help_text="Current usage count")
    max_usage_per_user = models.PositiveIntegerField(default=1, help_text="Maximum uses per user")
    first_order_only = models.BooleanField(default=False)
    new_user_only = models.BooleanField(default=False)
    stackable = models.BooleanField(default=False, help_text="Can be combined with other offers")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def is_exhausted(self):
        if self.max_usage_count == 0:
            return False
        return self.usage_count >= self.max_usage_count

    @property
    def remaining_uses(self):
        if self.max_usage_count == 0:
            return float('inf')
        return max(0, self.max_usage_count - self.usage_count)

    def is_visible_to_user(self):
        if self.visibility_percentage >= 100:
            return True
        import random
        return random.random() * 100 < float(self.visibility_percentage)

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('sms_sent', 'SMS Sent'),
    ]

    user = models.CharField(max_length=150)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=50, blank=True)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.resource}"

    class Meta:
        ordering = ['-created_at']


class VendorSummary(models.Model):
    vendor_name = models.CharField(max_length=200)
    total_orders = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    active_offers = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_approved = models.BooleanField(default=True)
    last_order_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.vendor_name

    class Meta:
        ordering = ['-total_revenue']
        verbose_name_plural = 'Vendor Summaries'


class Vendor(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    KYC_STATUS_CHOICES = [
        ('NOT_SUBMITTED', 'Not Submitted'),
        ('SUBMITTED', 'Submitted'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    VENDOR_TYPE_CHOICES = [
        ('VENUE', 'Venue Owner'),
        ('COACH', 'Coach/Trainer'),
        ('ECOM', 'E-commerce Vendor'),
        ('VENUE_COACH', 'Venue + Coach'),
        ('VENUE_ECOM', 'Venue + E-commerce'),
        ('COACH_ECOM', 'Coach + E-commerce'),
        ('ALL', 'All Services'),
    ]
    
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor_profile')
    name = models.CharField(max_length=200)
    legal_name = models.CharField(max_length=200, blank=True)
    owner_name = models.CharField(max_length=200, default='')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    business_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=100)
    vendor_type = models.CharField(max_length=20, choices=VENDOR_TYPE_CHOICES, default='VENUE')
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='NOT_SUBMITTED')
    kyc_document_url = models.URLField(blank=True)
    kyc_document_type = models.CharField(max_length=50, blank=True)
    kyc_verified = models.BooleanField(default=False)
    id_proof_1_url = models.URLField(blank=True)
    id_proof_1_type = models.CharField(max_length=50, blank=True)
    id_proof_2_url = models.URLField(blank=True)
    id_proof_2_type = models.CharField(max_length=50, blank=True)
    license_proof_url = models.URLField(blank=True)
    profile_photo_url = models.URLField(blank=True)
    rejection_reason = models.TextField(blank=True)
    suspension_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} ({self.name})"

    class Meta:
        ordering = ['-created_at']


class AdminUser(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='admin_profile')
    can_onboard_vendor = models.BooleanField(default=True)
    can_manage_vendors = models.BooleanField(default=True)
    can_manage_bookings = models.BooleanField(default=True)
    can_manage_commissions = models.BooleanField(default=False)
    can_manage_offers = models.BooleanField(default=True)
    can_manage_tickets = models.BooleanField(default=True)
    can_manage_reports = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=True)
    can_manage_memberships = models.BooleanField(default=True)
    can_manage_payouts = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin: {self.user.username}"

    class Meta:
        ordering = ['-created_at']


class VendorKYC(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    vendor = models.OneToOneField(Vendor, on_delete=models.CASCADE, related_name='kyc')
    pan_number = models.CharField(max_length=10, blank=True)
    pan_doc_url = models.URLField(blank=True)
    gst_number = models.CharField(max_length=15, blank=True)
    gst_doc_url = models.URLField(blank=True)
    bank_doc_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"KYC: {self.vendor.business_name}"

    class Meta:
        verbose_name = 'Vendor KYC'
        verbose_name_plural = 'Vendor KYCs'
        ordering = ['-created_at']


class Venue(models.Model):
    vendor = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='venues', null=True, blank=True)
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100, default='')
    address = models.TextField(default='')
    is_verified = models.BooleanField(default=False)
    opening_time = models.TimeField(default='06:00')
    closing_time = models.TimeField(default='22:00')
    amenities = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.city}"

    class Meta:
        ordering = ['name']


class Court(models.Model):
    SPORT_CHOICES = [
        ('badminton', 'Badminton'),
        ('tennis', 'Tennis'),
        ('basketball', 'Basketball'),
        ('football', 'Football'),
        ('cricket', 'Cricket'),
        ('squash', 'Squash'),
        ('volleyball', 'Volleyball'),
        ('tabletennis', 'Table Tennis'),
    ]
    
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='courts', null=True, blank=True)
    name = models.CharField(max_length=100)
    sport = models.CharField(max_length=50, choices=SPORT_CHOICES, default='badminton')
    base_price = models.IntegerField(default=500)
    slot_duration = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    has_lights = models.BooleanField(default=True)
    capacity = models.IntegerField(default=4)
    equipment = models.JSONField(default=list)
    availability = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.venue.name}"

    class Meta:
        ordering = ['name']


class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission = models.DecimalField(max_digits=10, decimal_places=2)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    period_start = models.DateField()
    period_end = models.DateField()
    transaction_id = models.CharField(max_length=100, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor.business_name} - {self.net_amount} ({self.status})"

    class Meta:
        ordering = ['-created_at']


class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    is_verified = models.BooleanField(default=False)
    total_bookings = models.IntegerField(default=0)
    last_booking_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
        ('RESCHEDULED', 'Rescheduled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
        ('PARTIAL', 'Partial'),
    ]
    
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='bookings')
    customer_name = models.CharField(max_length=150, default='Guest')
    customer_phone = models.CharField(max_length=20, blank=True, default='')
    customer_email = models.EmailField(blank=True, default='')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    adjustment_reason = models.TextField(blank=True)
    adjusted_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer_name} - {self.court.name} ({self.start_time.date()})"

    class Meta:
        ordering = ['-start_time']


class Slot(models.Model):
    court = models.ForeignKey(Court, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    price = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.court.name} - {self.date} {self.start_time}-{self.end_time}"

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['court', 'date', 'start_time']


class Ticket(models.Model):
    CATEGORY_CHOICES = [
        ('PAYMENT', 'Payment'),
        ('BOOKING', 'Booking'),
        ('APP_ISSUE', 'App Issue'),
        ('OTHER', 'Other'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('ESCALATED', 'Escalated'),
        ('CLOSED', 'Closed'),
    ]
    
    subject = models.CharField(max_length=300)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='tickets', null=True, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='tickets', null=True, blank=True)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    assigned_to = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    resolution_notes = models.TextField(blank=True)
    notes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"#{self.id} - {self.subject}"

    class Meta:
        ordering = ['-created_at']


class VendorOffer(models.Model):
    TYPE_CHOICES = [
        ('PERCENT', 'Percentage'),
        ('FLAT', 'Flat Amount'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='vendor_offers')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PERCENT')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField()
    active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.business_name} - {self.title}"

    class Meta:
        ordering = ['-created_at']


class Coach(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    DELIVERY_MODE_CHOICES = [
        ('VENUE', 'At Venue'),
        ('CUSTOMER_LOCATION', 'At Customer Location'),
        ('ONLINE', 'Online/Virtual'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='coaches')
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name='coaches')
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    photo_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    specializations = models.JSONField(default=list)
    certifications = models.JSONField(default=list)
    certificate_files = models.JSONField(default=list, help_text="List of certificate file URLs (max 5)")
    videos = models.JSONField(default=list, help_text="List of showcase video URLs (max 5)")
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=500)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_sessions = models.IntegerField(default=0)
    delivery_modes = models.JSONField(default=list)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='PENDING')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.vendor.business_name}"

    class Meta:
        ordering = ['-rating', 'name']


class CoachAvailability(models.Model):
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)
    lead_time_hours = models.IntegerField(default=6)

    def __str__(self):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return f"{self.coach.name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"

    class Meta:
        ordering = ['day_of_week', 'start_time']


class CoachPackage(models.Model):
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    session_count = models.IntegerField(default=1)
    duration_minutes = models.IntegerField(default=60)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    validity_days = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.coach.name} - {self.name} ({self.session_count} sessions)"

    class Meta:
        ordering = ['total_price']


class CoachingSession(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
    ]
    
    DELIVERY_MODE_CHOICES = [
        ('VENUE', 'At Venue'),
        ('CUSTOMER_LOCATION', 'At Customer Location'),
        ('ONLINE', 'Online/Virtual'),
    ]
    
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='sessions')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='coaching_sessions')
    package = models.ForeignKey(CoachPackage, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    session_type = models.CharField(max_length=200, default='1-on-1')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    delivery_mode = models.CharField(max_length=30, choices=DELIVERY_MODE_CHOICES, default='VENUE')
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name='coaching_sessions')
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')
    attendance_status = models.CharField(max_length=20, blank=True)
    feedback_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    feedback_notes = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.coach.name} - {self.customer.name} ({self.date})"

    class Meta:
        ordering = ['-date', '-start_time']


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('EQUIPMENT', 'Sports Equipment'),
        ('APPAREL', 'Apparel'),
        ('ACCESSORIES', 'Accessories'),
        ('NUTRITION', 'Nutrition & Supplements'),
        ('MERCHANDISE', 'Merchandise'),
        ('OTHER', 'Other'),
    ]
    
    SHIPPING_CLASS_CHOICES = [
        ('REGULAR', 'Regular'),
        ('EXPRESS', 'Express'),
        ('FRAGILE', 'Fragile'),
        ('HEAVY', 'Heavy'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')
    sku = models.CharField(max_length=100)
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='EQUIPMENT')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    images = models.JSONField(default=list)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    dimensions_cm = models.JSONField(default=dict)
    shipping_class = models.CharField(max_length=20, choices=SHIPPING_CLASS_CHOICES, default='REGULAR')
    is_returnable = models.BooleanField(default=True)
    return_window_days = models.IntegerField(default=7)
    warranty_description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sales_count = models.IntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['vendor', 'sku']

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku_suffix = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    class Meta:
        ordering = ['name']

    @property
    def full_sku(self):
        return f"{self.product.sku}-{self.sku_suffix}"

    @property
    def final_price(self):
        return self.product.price + self.price_adjustment


class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
        ('PARTIAL_REFUND', 'Partial Refund'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='orders')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    shipping_address = models.JSONField(default=dict)
    tracking_number = models.CharField(max_length=100, blank=True)
    courier_name = models.CharField(max_length=100, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order_number} - {self.customer.name}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} x{self.quantity}"

    class Meta:
        ordering = ['created_at']


class Membership(models.Model):
    TYPE_CHOICES = [
        ('SESSION', 'Session Based'),
        ('CREDIT', 'Credit Based'),
        ('UNLIMITED', 'Unlimited'),
        ('TIME', 'Time Based'),
    ]
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='memberships')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    membership_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SESSION')
    sessions_count = models.IntegerField(default=0)
    credits_count = models.IntegerField(default=0)
    validity_days = models.IntegerField(default=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    renewal_reminder_days = models.IntegerField(default=7)
    auto_renewal = models.BooleanField(default=False)
    applicable_services = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.business_name} - {self.name}"

    class Meta:
        ordering = ['price']


class CustomerMembership(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('PAUSED', 'Paused'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='memberships')
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='customer_memberships')
    start_date = models.DateField()
    end_date = models.DateField()
    sessions_used = models.IntegerField(default=0)
    sessions_remaining = models.IntegerField(default=0)
    credits_used = models.IntegerField(default=0)
    credits_remaining = models.IntegerField(default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    renewal_count = models.IntegerField(default=0)
    next_renewal_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.name} - {self.membership.name}"

    class Meta:
        ordering = ['-start_date']


class SuperAdmin(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='superadmin_profile')
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SuperAdmin: {self.full_name}"

    class Meta:
        verbose_name = 'Super Admin'
        verbose_name_plural = 'Super Admins'


class SystemConfig(models.Model):
    platform_name = models.CharField(max_length=200, default='Sports Platform')
    support_email = models.EmailField(default='support@sportsplatform.com')
    support_phone = models.CharField(max_length=20, default='+91-9999999999')
    maintenance_mode = models.BooleanField(default=False)
    login_banner_message = models.TextField(blank=True)
    global_terms_url = models.URLField(blank=True)
    privacy_policy_url = models.URLField(blank=True)
    default_commission_court = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    default_commission_coach = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    default_commission_ecommerce = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)
    default_commission_membership = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)
    max_upload_size_mb = models.IntegerField(default=10)
    logo_url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"System Config: {self.platform_name}"

    class Meta:
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configuration'

    @classmethod
    def get_config(cls):
        config, _ = cls.objects.get_or_create(pk=1)
        return config


class CommissionHistory(models.Model):
    changed_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='commission_changes')
    court_pct = models.DecimalField(max_digits=5, decimal_places=2)
    coach_pct = models.DecimalField(max_digits=5, decimal_places=2)
    ecommerce_pct = models.DecimalField(max_digits=5, decimal_places=2)
    membership_pct = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commission change by {self.changed_by} at {self.changed_at}"

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Commission Histories'


class BroadcastMessage(models.Model):
    TARGET_CHOICES = [
        ('ALL_VENDORS', 'All Vendors'),
        ('ALL_ADMINS', 'All Admins'),
        ('ALL', 'Everyone'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    title = models.CharField(max_length=200)
    body = models.TextField()
    target = models.CharField(max_length=20, choices=TARGET_CHOICES, default='ALL')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, related_name='broadcasts')
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Broadcast: {self.title}"

    class Meta:
        ordering = ['-created_at']
