from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from venues.models import Venue, Court, CourtAvailability, TimeSlot
from core.models import VendorProfile
from api.serializers import VenueSerializer, CourtSerializer


class VenueViewSet(viewsets.ModelViewSet):
    """
    Venue Management API
    GET/POST /api/v1/vendor/venues/ - List/Create venues
    GET/PUT/DELETE /api/v1/vendor/venues/{id}/ - Venue detail/update/delete
    """
    permission_classes = [IsAuthenticated]
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer

    def get_queryset(self):
        """Filter venues by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            return Venue.objects.filter(vendor=user.vendor_profile)
        return Venue.objects.none()

    def perform_create(self, serializer):
        """Create venue for current vendor"""
        user = self.request.user
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        serializer.save(vendor=user.vendor_profile)


class CourtViewSet(viewsets.ModelViewSet):
    """
    Court Management API
    GET/POST /api/v1/vendor/courts/ - List/Create courts
    GET/PUT/DELETE /api/v1/vendor/courts/{id}/ - Court detail/update/delete
    POST /api/v1/vendor/courts/{id}/availability/ - Set court availability
    POST /api/v1/vendor/courts/{id}/slots/generate/ - Generate time slots
    PUT /api/v1/vendor/courts/{id}/pricing/ - Update pricing
    """
    permission_classes = [IsAuthenticated]
    queryset = Court.objects.all()
    serializer_class = CourtSerializer

    def get_queryset(self):
        """Filter courts by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            return Court.objects.filter(venue__vendor=vendor)
        return Court.objects.none()

    @action(detail=True, methods=['post'])
    def availability(self, request, pk=None):
        """Set court availability"""
        court = self.get_object()
        availabilities = request.data.get('availabilities', [])
        
        # Delete existing availabilities
        CourtAvailability.objects.filter(court=court).delete()
        
        # Create new availabilities
        created = []
        for avail in availabilities:
            ca = CourtAvailability.objects.create(
                court=court,
                day_of_week=avail['day_of_week'],
                start_time=avail['start_time'],
                end_time=avail['end_time'],
                is_available=avail.get('is_available', True)
            )
            created.append(ca)
        
        return Response({
            'id': str(court.id),
            'availabilities_updated': len(created),
            'message': 'Court availability updated'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def generate_slots(self, request, pk=None):
        """Generate time slots for a specific date"""
        court = self.get_object()
        date = request.data.get('date')
        slot_duration_minutes = request.data.get('slot_duration_minutes', 60)
        start_time = request.data.get('start_time', '06:00')
        end_time = request.data.get('end_time', '22:00')
        
        if not date:
            return Response(
                {'error': 'Date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse times
        from datetime import datetime, timedelta
        start_dt = datetime.strptime(start_time, '%H:%M').time()
        end_dt = datetime.strptime(end_time, '%H:%M').time()
        
        # Generate slots
        slots_created = 0
        current_time = datetime.combine(datetime.strptime(date, '%Y-%m-%d').date(), start_dt)
        end_datetime = datetime.combine(datetime.strptime(date, '%Y-%m-%d').date(), end_dt)
        
        while current_time + timedelta(minutes=slot_duration_minutes) <= end_datetime:
            slot_start = current_time.time()
            slot_end = (current_time + timedelta(minutes=slot_duration_minutes)).time()
            
            # Check if slot already exists
            if not TimeSlot.objects.filter(
                court=court,
                date=date,
                start_time=slot_start,
                end_time=slot_end
            ).exists():
                TimeSlot.objects.create(
                    court=court,
                    date=date,
                    start_time=slot_start,
                    end_time=slot_end,
                    duration_minutes=slot_duration_minutes,
                    base_price=court.base_price_per_hour * (slot_duration_minutes / 60),
                    status='AVAILABLE'
                )
                slots_created += 1
            
            current_time += timedelta(minutes=slot_duration_minutes)
        
        return Response({
            'date': date,
            'slots_generated': slots_created,
            'court_id': str(court.id)
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'])
    def pricing(self, request, pk=None):
        """Update court pricing"""
        court = self.get_object()
        base_price = request.data.get('base_price_per_hour')
        
        if base_price:
            court.base_price_per_hour = base_price
            court.save(update_fields=['base_price_per_hour'])
        
        # TODO: Handle time-based pricing slots
        
        return Response({
            'id': str(court.id),
            'pricing_updated': True,
            'effective_from': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)

