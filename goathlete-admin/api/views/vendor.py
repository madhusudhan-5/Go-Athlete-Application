from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta

from venues.models import Venue, Court
from bookings.models import Booking
from core.models import Offer, VendorProfile
from memberships.models import Membership, CustomerMembership


class VendorDashboardViewSet(viewsets.ViewSet):
    """
    Vendor Dashboard API
    GET /api/v1/vendor/dashboard/ - Get dashboard stats
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get vendor dashboard statistics"""
        user = request.user
        
        # Get vendor profile
        if not hasattr(user, 'vendor_profile'):
            return Response(
                {'error': 'User is not associated with a vendor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        vendor = user.vendor_profile
        today = timezone.now().date()
        
        # Today's bookings
        today_bookings = Booking.objects.filter(
            court__venue__vendor=vendor,
            date=today,
            booking_status__in=['CONFIRMED', 'COMPLETED']
        ).count()
        
        # Today's earnings
        today_earnings = Booking.objects.filter(
            court__venue__vendor=vendor,
            date=today,
            payment_status='PAID'
        ).aggregate(total=Sum('vendor_payout'))['total'] or 0
        
        # Pending payout
        pending_payout = Booking.objects.filter(
            court__venue__vendor=vendor,
            payment_status='PAID',
            booking_status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('vendor_payout'))['total'] or 0
        
        # Total customers
        total_customers = Booking.objects.filter(
            court__venue__vendor=vendor
        ).values('customer_user').distinct().count()
        
        # Active courts
        active_courts = Court.objects.filter(
            venue__vendor=vendor,
            is_active=True
        ).count()
        
        # Average rating
        avg_rating = vendor.avg_rating or 0
        
        # Occupancy percentage (today)
        total_slots_today = 0
        booked_slots_today = today_bookings
        # TODO: Calculate from TimeSlot model
        
        # This month revenue
        month_start = today.replace(day=1)
        this_month_revenue = Booking.objects.filter(
            court__venue__vendor=vendor,
            date__gte=month_start,
            payment_status='PAID'
        ).aggregate(total=Sum('vendor_payout'))['total'] or 0
        
        # Active offers count
        active_offers = Offer.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            applicable_categories__contains=[vendor.vendor_type] if vendor.vendor_type != 'HYBRID' else ['VENUE', 'COACH', 'ECOMMERCE']
        ).count()
        
        # Active memberships count
        active_memberships = CustomerMembership.objects.filter(
            membership__vendor=vendor,
            status='ACTIVE'
        ).count()
        
        return Response({
            'today_bookings': today_bookings,
            'today_earnings': float(today_earnings),
            'pending_payout': float(pending_payout),
            'total_customers': total_customers,
            'active_courts': active_courts,
            'avg_rating': float(avg_rating),
            'occupancy_percentage': 0,  # TODO: Calculate
            'this_month_revenue': float(this_month_revenue),
            'active_offers_count': active_offers,
            'active_memberships_count': active_memberships,
            'quick_actions': [
                {'action': 'add_court', 'icon': 'plus', 'label': 'Add Court'},
                {'action': 'view_bookings', 'icon': 'calendar', 'label': 'View Bookings'},
                {'action': 'manage_offers', 'icon': 'tag', 'label': 'Manage Offers'}
            ]
        }, status=status.HTTP_200_OK)

