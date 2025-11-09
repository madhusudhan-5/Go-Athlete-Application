from rest_framework import serializers
from venues.models import Venue, Court
from core.models import Offer


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'description', 'address', 'latitude', 'longitude',
            'phone_number', 'images', 'amenities', 'opening_time', 'closing_time',
            'is_open_24_7', 'holiday_dates', 'cancellation_window_hours',
            'reschedule_window_hours', 'is_verified', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'updated_at']


class CourtSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    
    class Meta:
        model = Court
        fields = [
            'id', 'venue', 'venue_name', 'name', 'court_type', 'base_price_per_hour',
            'currency', 'surface_type', 'capacity', 'lights_available',
            'equipment_available', 'images', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = [
            'id', 'name', 'description', 'offer_type', 'discount_type',
            'discount_value', 'max_discount_cap', 'minimum_booking_amount',
            'start_date', 'end_date', 'start_time', 'end_time',
            'usage_limit_total', 'usage_limit_per_customer', 'is_active',
            'redemption_count', 'revenue_impact'
        ]

