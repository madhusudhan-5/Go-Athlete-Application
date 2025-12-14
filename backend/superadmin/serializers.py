from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    GlobalConfig, Offer, AuditLog, VendorSummary, Vendor, Venue, Court, 
    Customer, Booking, Ticket, Payout, Slot, AdminUser, VendorKYC, VendorOffer,
    Coach, CoachAvailability, CoachPackage, CoachingSession,
    Product, ProductVariant, Order, OrderItem,
    Membership, CustomerMembership,
    SuperAdmin, SystemConfig, CommissionHistory, BroadcastMessage
)


class GlobalConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalConfig
        fields = ['id', 'commission_percentage', 'payout_cycle', 'min_payout_threshold', 
                  'booking_cancellation_window_hours', 'updated_at']
    
    def validate_commission_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission must be between 0 and 100")
        return value
    
    def validate_min_payout_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError("Minimum payout must be >= 0")
        return value
    
    def validate_booking_cancellation_window_hours(self, value):
        if value < 0:
            raise serializers.ValidationError("Cancellation window must be >= 0")
        return value


class OfferSerializer(serializers.ModelSerializer):
    is_exhausted = serializers.BooleanField(read_only=True)
    remaining_uses = serializers.SerializerMethodField()
    
    class Meta:
        model = Offer
        fields = '__all__'
    
    def get_remaining_uses(self, obj):
        remaining = obj.remaining_uses
        return None if remaining == float('inf') else remaining
    
    def validate_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("Discount value must be > 0")
        return value
    
    def validate_visibility_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Visibility must be between 0 and 100")
        return value
    
    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError({"end_date": "End date must be after start date"})
        if data.get('offer_type') == 'PERCENT' and data.get('value', 0) > 100:
            raise serializers.ValidationError({"value": "Percentage cannot exceed 100"})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


class AuditLogDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'resource', 'resource_id', 
                  'old_values', 'new_values', 'details', 'ip_address', 'created_at']


class VendorSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorSummary
        fields = '__all__'


class SendSMSSerializer(serializers.Serializer):
    to = serializers.CharField(max_length=20)
    message = serializers.CharField(max_length=1600)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'


class VendorDetailSerializer(serializers.ModelSerializer):
    venues_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = '__all__'
    
    def get_venues_count(self, obj):
        return Venue.objects.filter(vendor__id=obj.id).count()


class CourtSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_city = serializers.CharField(source='venue.city', read_only=True)
    
    class Meta:
        model = Court
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    venue_name = serializers.CharField(source='court.venue.name', read_only=True)
    booking_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = '__all__'
    
    def get_booking_date(self, obj):
        return obj.start_time.date() if obj.start_time else None


class BookingAdjustSerializer(serializers.Serializer):
    adjusted_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    adjustment_reason = serializers.CharField(max_length=500)


class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'


class TicketAssignSerializer(serializers.Serializer):
    assigned_to = serializers.CharField(max_length=150)


class VenueSerializer(serializers.ModelSerializer):
    courts_count = serializers.SerializerMethodField()
    vendor_username = serializers.CharField(source='vendor.username', read_only=True)
    
    class Meta:
        model = Venue
        fields = '__all__'
    
    def get_courts_count(self, obj):
        return obj.courts.count()


class VenueCreateSerializer(serializers.ModelSerializer):
    vendor_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = Venue
        fields = ['vendor_id', 'name', 'address', 'city', 'opening_time', 'closing_time', 'amenities', 'is_verified']
        extra_kwargs = {
            'name': {'required': True},
            'address': {'required': True},
            'city': {'required': False},
            'opening_time': {'required': False},
            'closing_time': {'required': False},
            'amenities': {'required': False},
            'is_verified': {'required': False},
        }
    
    def to_internal_value(self, data):
        allowed_fields = set(self.Meta.fields)
        filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
        return super().to_internal_value(filtered_data)
    
    def create(self, validated_data):
        vendor_id = validated_data.pop('vendor_id')
        try:
            vendor = Vendor.objects.get(user_id=vendor_id)
            validated_data['vendor'] = vendor.user
        except Vendor.DoesNotExist:
            try:
                vendor = Vendor.objects.get(id=vendor_id)
                validated_data['vendor'] = vendor.user
            except Vendor.DoesNotExist:
                raise serializers.ValidationError({'vendor_id': 'Vendor not found'})
        return super().create(validated_data)


class CourtCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Court
        fields = ['venue', 'name', 'sport', 'base_price', 'slot_duration', 
                  'has_lights', 'capacity', 'equipment', 'availability']


class PayoutSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    
    class Meta:
        model = Payout
        fields = '__all__'


class SlotSerializer(serializers.Serializer):
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    is_available = serializers.BooleanField()
    court_id = serializers.IntegerField()
    court_name = serializers.CharField()
    price = serializers.IntegerField(required=False)


class SlotModelSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    
    class Meta:
        model = Slot
        fields = '__all__'


class VendorDashboardSerializer(serializers.Serializer):
    total_venues = serializers.IntegerField()
    total_courts = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    today_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_payout = serializers.DecimalField(max_digits=12, decimal_places=2)


class GenerateSlotsSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    slot_minutes = serializers.IntegerField(min_value=15, max_value=180)
    start_time = serializers.TimeField(required=False, default='06:00')
    end_time = serializers.TimeField(required=False, default='22:00')
    save = serializers.BooleanField(default=False)


class AdminUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AdminUser
        fields = ['id', 'username', 'email', 'can_onboard_vendor', 'can_manage_bookings', 
                  'can_view_reports', 'is_suspended', 'created_at', 'updated_at']


class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    can_onboard_vendor = serializers.BooleanField(default=True)
    can_manage_bookings = serializers.BooleanField(default=True)
    can_view_reports = serializers.BooleanField(default=True)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, data):
        if not any([data.get('can_onboard_vendor'), data.get('can_manage_bookings'), data.get('can_view_reports')]):
            raise serializers.ValidationError("At least one permission must be enabled")
        return data


class VendorKYCSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    
    class Meta:
        model = VendorKYC
        fields = '__all__'
    
    def validate_pan_number(self, value):
        import re
        if value and not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', value):
            raise serializers.ValidationError("Invalid PAN format")
        return value
    
    def validate_gst_number(self, value):
        import re
        if value and not re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$', value):
            raise serializers.ValidationError("Invalid GST format")
        return value


class VendorRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=10)


class VendorSuspendSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=10)


class TicketNoteSerializer(serializers.Serializer):
    note = serializers.CharField(max_length=1000)


class ReportsSummarySerializer(serializers.Serializer):
    bookings_count = serializers.IntegerField()
    cancellations_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class VendorOfferSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    
    class Meta:
        model = VendorOffer
        fields = ['id', 'vendor', 'vendor_name', 'title', 'description', 'discount_type', 
                  'discount_value', 'valid_from', 'valid_to', 'active', 'created_at', 'updated_at']
    
    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("Discount value must be > 0")
        return value
    
    def validate(self, data):
        if data.get('valid_from') and data.get('valid_to'):
            if data['valid_to'] < data['valid_from']:
                raise serializers.ValidationError({"valid_to": "End date must be after start date"})
        if data.get('discount_type') == 'PERCENT' and data.get('discount_value', 0) > 100:
            raise serializers.ValidationError({"discount_value": "Percentage cannot exceed 100"})
        return data


class CoachSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Coach
        fields = '__all__'


class CoachCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coach
        fields = ['vendor', 'venue', 'name', 'email', 'phone', 'photo_url', 'bio', 
                  'specializations', 'certifications', 'certificate_files', 'videos',
                  'experience_years', 'hourly_rate', 'delivery_modes']


class CoachAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CoachAvailability
        fields = '__all__'
    
    def get_day_name(self, obj):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[obj.day_of_week] if 0 <= obj.day_of_week < 7 else 'Unknown'


class CoachPackageSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    
    class Meta:
        model = CoachPackage
        fields = '__all__'


class CoachingSessionSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CoachingSession
        fields = '__all__'


class CoachingSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachingSession
        fields = ['coach', 'customer', 'package', 'session_type', 'date', 'start_time', 
                  'end_time', 'delivery_mode', 'venue', 'base_price', 'total_amount', 'notes']


class ProductSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    variants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def get_variants_count(self, obj):
        return obj.variants.count()


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['vendor', 'sku', 'name', 'description', 'category', 'price', 'cost_price',
                  'discount_percentage', 'stock_quantity', 'low_stock_threshold', 'images',
                  'weight_kg', 'dimensions_cm', 'shipping_class', 'is_returnable', 
                  'return_window_days', 'warranty_description']


class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    full_sku = serializers.CharField(read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
    
    def get_items_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['vendor', 'customer', 'order_number', 'subtotal', 'discount_amount',
                  'tax_amount', 'shipping_amount', 'total_amount', 'shipping_address', 
                  'payment_method', 'notes']


class MembershipSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    active_members = serializers.SerializerMethodField()
    
    class Meta:
        model = Membership
        fields = '__all__'
    
    def get_active_members(self, obj):
        return obj.customer_memberships.filter(status='ACTIVE').count()


class MembershipCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ['vendor', 'name', 'description', 'membership_type', 'sessions_count',
                  'credits_count', 'validity_days', 'price', 'discount_percentage',
                  'renewal_reminder_days', 'auto_renewal', 'applicable_services']


class CustomerMembershipSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    membership_name = serializers.CharField(source='membership.name', read_only=True)
    membership_type = serializers.CharField(source='membership.membership_type', read_only=True)
    
    class Meta:
        model = CustomerMembership
        fields = '__all__'


class CustomerMembershipCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerMembership
        fields = ['customer', 'membership', 'start_date', 'end_date', 'sessions_remaining',
                  'credits_remaining', 'amount_paid']


class SuperAdminSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SuperAdmin
        fields = ['id', 'email', 'username', 'full_name', 'phone', 'is_active', 'created_at', 'updated_at']


class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = '__all__'
    
    def validate_default_commission_court(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission must be between 0 and 100")
        return value
    
    def validate_default_commission_coach(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission must be between 0 and 100")
        return value
    
    def validate_default_commission_ecommerce(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission must be between 0 and 100")
        return value
    
    def validate_default_commission_membership(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission must be between 0 and 100")
        return value


class CommissionHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = CommissionHistory
        fields = ['id', 'changed_by', 'changed_by_name', 'court_pct', 'coach_pct', 
                  'ecommerce_pct', 'membership_pct', 'reason', 'changed_at']


class CommissionOverrideSerializer(serializers.Serializer):
    court_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    coach_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    ecommerce_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    membership_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_court_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Value must be between 0 and 100")
        return value
    
    def validate_coach_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Value must be between 0 and 100")
        return value
    
    def validate_ecommerce_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Value must be between 0 and 100")
        return value
    
    def validate_membership_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Value must be between 0 and 100")
        return value


class BroadcastMessageSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = BroadcastMessage
        fields = '__all__'


class BroadcastCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BroadcastMessage
        fields = ['title', 'body', 'target', 'priority', 'expires_at']


class AdminUserFullSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminUser
        fields = ['id', 'email', 'username', 'full_name', 'can_onboard_vendor', 'can_manage_vendors',
                  'can_manage_bookings', 'can_manage_commissions', 'can_manage_offers',
                  'can_manage_tickets', 'can_manage_reports', 'can_view_reports',
                  'can_manage_memberships', 'can_manage_payouts', 'is_suspended',
                  'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class AdminUserCreateBySuper(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    can_manage_vendors = serializers.BooleanField(default=True)
    can_manage_bookings = serializers.BooleanField(default=True)
    can_manage_commissions = serializers.BooleanField(default=False)
    can_manage_offers = serializers.BooleanField(default=True)
    can_manage_tickets = serializers.BooleanField(default=True)
    can_manage_reports = serializers.BooleanField(default=False)
    can_view_reports = serializers.BooleanField(default=True)
    can_manage_memberships = serializers.BooleanField(default=True)
    can_manage_payouts = serializers.BooleanField(default=False)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An admin with this email already exists")
        return value


class AdminPermissionsUpdateSerializer(serializers.Serializer):
    can_manage_vendors = serializers.BooleanField(required=False)
    can_manage_bookings = serializers.BooleanField(required=False)
    can_manage_commissions = serializers.BooleanField(required=False)
    can_manage_offers = serializers.BooleanField(required=False)
    can_manage_tickets = serializers.BooleanField(required=False)
    can_manage_reports = serializers.BooleanField(required=False)
    can_view_reports = serializers.BooleanField(required=False)
    can_manage_memberships = serializers.BooleanField(required=False)
    can_manage_payouts = serializers.BooleanField(required=False)
