from rest_framework import serializers
from .models import Booking
from venues.models import Court, Venue
from core.models import Offer
from accounts.models import User


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view"""
    court = serializers.SerializerMethodField()
    applied_offer = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'court', 'customer_name', 'customer_phone',
            'date', 'start_time', 'end_time', 'base_price',
            'applied_offer', 'total_amount', 'commission_amount',
            'vendor_payout', 'payment_status', 'booking_status',
            'internal_notes', 'customer_notes', 'created_at'
        ]

    def get_court(self, obj):
        return {
            'id': str(obj.court.id),
            'name': obj.court.name
        }

    def get_applied_offer(self, obj):
        if obj.applied_offer:
            return {
                'id': str(obj.applied_offer.id),
                'name': obj.applied_offer.name,
                'discount_amount': float(obj.discount_amount)
            }
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for booking detail view"""
    court = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    applied_offer = serializers.SerializerMethodField()
    can_reschedule = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    rescheduling_window_hours = serializers.SerializerMethodField()
    cancellation_window_hours = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'court', 'customer', 'date', 'start_time', 'end_time',
            'duration_minutes', 'base_price', 'discount_amount', 'applied_offer',
            'tax_percentage', 'tax_amount', 'commission_percentage',
            'commission_amount', 'total_amount', 'vendor_payout',
            'payment_method', 'payment_status', 'payment_id', 'booking_status',
            'customer_notes', 'internal_notes', 'can_reschedule', 'can_cancel',
            'rescheduling_window_hours', 'cancellation_window_hours',
            'created_at', 'updated_at'
        ]

    def get_court(self, obj):
        return {
            'id': str(obj.court.id),
            'name': obj.court.name,
            'venue': {
                'id': str(obj.court.venue.id),
                'name': obj.court.venue.name
            }
        }

    def get_customer(self, obj):
        if obj.customer_user:
            # Get customer stats
            total_bookings = Booking.objects.filter(
                customer_user=obj.customer_user,
                booking_status__in=['CONFIRMED', 'COMPLETED']
            ).count()
            
            return {
                'id': str(obj.customer_user.id),
                'name': obj.customer_name,
                'phone': obj.customer_phone,
                'email': obj.customer_email,
                'total_bookings': total_bookings,
                'avg_rating': None,  # TODO: Calculate from reviews
                'member_since': obj.customer_user.date_joined.isoformat() if obj.customer_user else None
            }
        return {
            'name': obj.customer_name,
            'phone': obj.customer_phone,
            'email': obj.customer_email
        }

    def get_applied_offer(self, obj):
        if obj.applied_offer:
            return {
                'id': str(obj.applied_offer.id),
                'name': obj.applied_offer.name,
                'offer_type': obj.applied_offer.offer_type
            }
        return None

    def get_can_reschedule(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        if obj.booking_status != 'CONFIRMED':
            return False
        
        booking_datetime = timezone.make_aware(
            timezone.datetime.combine(obj.date, obj.start_time)
        )
        reschedule_window = timedelta(hours=obj.court.venue.reschedule_window_hours)
        
        return timezone.now() < (booking_datetime - reschedule_window)

    def get_can_cancel(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        if obj.booking_status not in ['CONFIRMED', 'RESCHEDULED']:
            return False
        
        booking_datetime = timezone.make_aware(
            timezone.datetime.combine(obj.date, obj.start_time)
        )
        cancellation_window = timedelta(hours=obj.court.venue.cancellation_window_hours)
        
        return timezone.now() < (booking_datetime - cancellation_window)

    def get_rescheduling_window_hours(self, obj):
        return obj.court.venue.reschedule_window_hours

    def get_cancellation_window_hours(self, obj):
        return obj.court.venue.cancellation_window_hours


class BookingCreateSerializer(serializers.Serializer):
    """Serializer for creating a booking"""
    court_id = serializers.UUIDField()
    customer_phone = serializers.CharField(max_length=17, required=False)
    customer_email = serializers.EmailField(required=False)
    customer_name = serializers.CharField(max_length=200, required=False)
    customer_user_id = serializers.UUIDField(required=False)
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    payment_method = serializers.ChoiceField(choices=Booking.PAYMENT_METHOD_CHOICES, default='ONLINE')
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    internal_notes = serializers.CharField(required=False, allow_blank=True)
    apply_offer_id = serializers.UUIDField(required=False, help_text="Optional: specific offer to apply")


class BookingRescheduleSerializer(serializers.Serializer):
    """Serializer for rescheduling a booking"""
    new_date = serializers.DateField()
    new_start_time = serializers.TimeField()
    new_end_time = serializers.TimeField()


class BookingCancelSerializer(serializers.Serializer):
    """Serializer for cancelling a booking"""
    reason = serializers.CharField(required=False, allow_blank=True)

