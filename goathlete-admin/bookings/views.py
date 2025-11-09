from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from decimal import Decimal

from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    BookingRescheduleSerializer,
    BookingCancelSerializer
)
from venues.models import Court, TimeSlot
from core.models import Offer, CommissionConfig
from accounts.models import User


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookings
    GET /api/v1/vendor/bookings/ - List bookings
    GET /api/v1/vendor/bookings/{id}/ - Booking detail
    POST /api/v1/vendor/bookings/ - Create booking
    PUT /api/v1/vendor/bookings/{id}/reschedule/ - Reschedule booking
    POST /api/v1/vendor/bookings/{id}/cancel/ - Cancel booking
    """
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()

    def get_queryset(self):
        """Filter bookings by vendor"""
        user = self.request.user
        
        # Get vendor profile
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            # Get all courts for this vendor's venues
            courts = Court.objects.filter(venue__vendor=vendor)
            return Booking.objects.filter(court__in=courts)
        
        # If user is staff member
        if hasattr(user, 'vendor_staff_roles'):
            staff_role = user.vendor_staff_roles.first()
            if staff_role:
                vendor = staff_role.vendor
                courts = Court.objects.filter(venue__vendor=vendor)
                return Booking.objects.filter(court__in=courts)
        
        return Booking.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        elif self.action == 'retrieve':
            return BookingDetailSerializer
        elif self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'reschedule':
            return BookingRescheduleSerializer
        elif self.action == 'cancel':
            return BookingCancelSerializer
        return BookingListSerializer

    def list(self, request):
        """List bookings with filters"""
        queryset = self.get_queryset()
        
        # Filters
        date = request.query_params.get('date')
        status_filter = request.query_params.get('status')
        court_id = request.query_params.get('court_id')
        payment_status = request.query_params.get('payment_status')
        
        if date:
            queryset = queryset.filter(date=date)
        if status_filter:
            queryset = queryset.filter(booking_status=status_filter)
        if court_id:
            queryset = queryset.filter(court_id=court_id)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['today_count'] = queryset.filter(date=timezone.now().date()).count()
            return response
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'today_count': queryset.filter(date=timezone.now().date()).count(),
            'results': serializer.data
        })

    def retrieve(self, request, pk=None):
        """Get booking detail"""
        booking = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request):
        """Create a new booking"""
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        user = request.user
        
        # Get vendor
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
        elif hasattr(user, 'vendor_staff_roles'):
            vendor = user.vendor_staff_roles.first().vendor
        else:
            return Response(
                {'error': 'User is not associated with a vendor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get court
        court = get_object_or_404(Court, id=data['court_id'])
        
        # Verify court belongs to vendor
        if court.venue.vendor != vendor:
            return Response(
                {'error': 'Court does not belong to your vendor account'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create customer
        customer_user = None
        if data.get('customer_user_id'):
            customer_user = get_object_or_404(User, id=data['customer_user_id'], role='CUSTOMER')
        elif data.get('customer_phone'):
            # Try to find existing customer
            customer_user = User.objects.filter(
                phone_number=data['customer_phone'],
                role='CUSTOMER'
            ).first()
        
        # Get customer details
        customer_name = data.get('customer_name') or (customer_user.get_full_name() if customer_user else '')
        customer_phone = data.get('customer_phone') or (customer_user.phone_number if customer_user else '')
        customer_email = data.get('customer_email') or (customer_user.email if customer_user else '')
        
        # Check slot availability
        date = data['date']
        start_time = data['start_time']
        end_time = data['end_time']
        
        # Calculate duration
        start_dt = datetime.combine(date, start_time)
        end_dt = datetime.combine(date, end_time)
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        # Check if slot is available
        conflicting_slots = TimeSlot.objects.filter(
            court=court,
            date=date,
            status='BOOKED',
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        
        if conflicting_slots.exists():
            return Response(
                {'error': 'Time slot is already booked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create time slot
        time_slot, created = TimeSlot.objects.get_or_create(
            court=court,
            date=date,
            start_time=start_time,
            end_time=end_time,
            defaults={
                'duration_minutes': duration_minutes,
                'base_price': court.base_price_per_hour * (duration_minutes / 60),
                'status': 'AVAILABLE'
            }
        )
        
        if time_slot.status != 'AVAILABLE':
            return Response(
                {'error': f'Time slot is {time_slot.status.lower()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate base price
        base_price = court.base_price_per_hour * Decimal(str(duration_minutes / 60))
        
        # Apply offer
        applied_offer = None
        discount_amount = Decimal('0')
        
        if data.get('apply_offer_id'):
            # Apply specific offer
            applied_offer = get_object_or_404(Offer, id=data['apply_offer_id'], is_active=True)
            discount_amount = self._calculate_discount(applied_offer, base_price)
        else:
            # Auto-apply best offer
            best_offer, discount = self._get_best_offer(
                customer_user, date, start_time, 'VENUE', base_price, vendor
            )
            if best_offer:
                applied_offer = best_offer
                discount_amount = discount
        
        # Calculate commission
        commission_rate, commission_amount, vendor_payout = self._calculate_commission(
            base_price - discount_amount, vendor, 'VENUE'
        )
        
        # Calculate tax
        taxable_amount = base_price - discount_amount
        tax_percentage = Decimal('18.0')  # GST
        tax_amount = taxable_amount * (tax_percentage / Decimal('100'))
        total_amount = taxable_amount + tax_amount
        
        # Recalculate commission on total amount
        commission_amount = total_amount * (commission_rate / Decimal('100'))
        vendor_payout = total_amount - commission_amount
        
        # Create booking
        booking = Booking.objects.create(
            court=court,
            customer_user=customer_user,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            date=date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            base_price=base_price,
            discount_amount=discount_amount,
            applied_offer=applied_offer,
            taxable_amount=taxable_amount,
            tax_percentage=tax_percentage,
            tax_amount=tax_amount,
            commission_percentage=commission_rate,
            commission_amount=commission_amount,
            total_amount=total_amount,
            vendor_payout=vendor_payout,
            payment_method=data['payment_method'],
            payment_status='PENDING' if data['payment_method'] == 'ONLINE' else 'PAID',
            booking_status='CONFIRMED' if data['payment_method'] == 'CASH' else 'CONFIRMED',
            customer_notes=data.get('customer_notes', ''),
            internal_notes=data.get('internal_notes', ''),
            created_by=user
        )
        
        # Update time slot
        time_slot.status = 'BOOKED'
        time_slot.booked_by = booking
        time_slot.save()
        
        # Update offer redemption count
        if applied_offer:
            applied_offer.redemption_count += 1
            applied_offer.revenue_impact += discount_amount
            applied_offer.save(update_fields=['redemption_count', 'revenue_impact'])
        
        # Update vendor analytics
        vendor.total_bookings += 1
        vendor.total_revenue += total_amount
        vendor.save(update_fields=['total_bookings', 'total_revenue'])
        
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'])
    def reschedule(self, request, pk=None):
        """Reschedule a booking"""
        booking = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = BookingRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Check if rescheduling is allowed
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        reschedule_window = timedelta(hours=booking.court.venue.reschedule_window_hours)
        
        if timezone.now() >= (booking_datetime - reschedule_window):
            return Response(
                {'error': f'Rescheduling is only allowed {booking.court.venue.reschedule_window_hours} hours before booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check new slot availability
        new_date = data['new_date']
        new_start_time = data['new_start_time']
        new_end_time = data['new_end_time']
        
        conflicting_slots = TimeSlot.objects.filter(
            court=booking.court,
            date=new_date,
            status='BOOKED',
            start_time__lt=new_end_time,
            end_time__gt=new_start_time
        ).exclude(booked_by=booking)
        
        if conflicting_slots.exists():
            return Response(
                {'error': 'New time slot is already booked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Free old slot
        old_slot = TimeSlot.objects.filter(booked_by=booking).first()
        if old_slot:
            old_slot.status = 'AVAILABLE'
            old_slot.booked_by = None
            old_slot.save()
        
        # Book new slot
        new_slot, created = TimeSlot.objects.get_or_create(
            court=booking.court,
            date=new_date,
            start_time=new_start_time,
            end_time=new_end_time,
            defaults={
                'duration_minutes': booking.duration_minutes,
                'base_price': booking.base_price,
                'status': 'BOOKED',
                'booked_by': booking
            }
        )
        
        if not created:
            new_slot.status = 'BOOKED'
            new_slot.booked_by = booking
            new_slot.save()
        
        # Update booking
        booking.date = new_date
        booking.start_time = new_start_time
        booking.end_time = new_end_time
        booking.booking_status = 'RESCHEDULED'
        booking.save()
        
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = BookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if cancellation is allowed
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        cancellation_window = timedelta(hours=booking.court.venue.cancellation_window_hours)
        
        if timezone.now() >= (booking_datetime - cancellation_window):
            return Response(
                {'error': f'Cancellation is only allowed {booking.court.venue.cancellation_window_hours} hours before booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Free time slot
        time_slot = TimeSlot.objects.filter(booked_by=booking).first()
        if time_slot:
            time_slot.status = 'AVAILABLE'
            time_slot.booked_by = None
            time_slot.save()
        
        # Calculate refund
        refund_amount = booking.total_amount if booking.payment_status == 'PAID' else Decimal('0')
        
        # Update booking
        booking.booking_status = 'CANCELLED'
        booking.cancellation_reason = serializer.validated_data.get('reason', '')
        booking.refund_amount = refund_amount
        booking.refund_status = 'PENDING' if refund_amount > 0 else None
        booking.save()
        
        # TODO: Process refund via Razorpay if payment was online
        if refund_amount > 0 and booking.payment_method == 'ONLINE':
            # Trigger refund process
            pass
        
        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    def _get_best_offer(self, customer_user, date, time, category, base_price, vendor):
        """Get best applicable offer for customer"""
        from django.utils import timezone
        
        # Get all active offers for category
        offers = Offer.objects.filter(
            is_active=True,
            start_date__lte=date,
            end_date__gte=date,
            applicable_categories__contains=[category]
        )
        
        # Filter by vendor if specified
        if offers.filter(applicable_vendor_ids__contains=[str(vendor.id)]).exists():
            offers = offers.filter(applicable_vendor_ids__contains=[str(vendor.id)])
        elif offers.filter(applicable_vendor_ids__isnull=True).exists():
            offers = offers.filter(applicable_vendor_ids__isnull=True)
        else:
            return None, Decimal('0')
        
        # Check time validity
        day_of_week = date.weekday()
        applicable_offers = []
        
        for offer in offers:
            # Check day of week
            if offer.applicable_days_of_week and day_of_week not in offer.applicable_days_of_week:
                continue
            
            # Check time range
            if offer.start_time and offer.end_time:
                if not (offer.start_time <= time <= offer.end_time):
                    continue
            
            # Check minimum booking amount
            if offer.minimum_booking_amount and base_price < offer.minimum_booking_amount:
                continue
            
            # Check customer eligibility
            if customer_user:
                if str(customer_user.id) in offer.exclude_customer_ids:
                    continue
                if offer.include_customer_ids and str(customer_user.id) not in offer.include_customer_ids:
                    continue
                
                # Check usage limit
                if offer.usage_limit_per_customer:
                    usage_count = Booking.objects.filter(
                        customer_user=customer_user,
                        applied_offer=offer
                    ).count()
                    if usage_count >= offer.usage_limit_per_customer:
                        continue
            
            # Check total usage limit
            if offer.usage_limit_total and offer.redemption_count >= offer.usage_limit_total:
                continue
            
            applicable_offers.append(offer)
        
        if not applicable_offers:
            return None, Decimal('0')
        
        # Sort by discount value (highest first)
        applicable_offers.sort(key=lambda x: x.discount_value, reverse=True)
        
        # Apply visibility percentage filter (top X%)
        if len(applicable_offers) > 1:
            top_count = max(1, int(len(applicable_offers) * (applicable_offers[0].visibility_percentage / 100)))
            applicable_offers = applicable_offers[:top_count]
        
        # Get best offer
        best_offer = applicable_offers[0]
        discount = self._calculate_discount(best_offer, base_price)
        
        return best_offer, discount

    def _calculate_discount(self, offer, base_price):
        """Calculate discount amount from offer"""
        if offer.discount_type == 'PERCENTAGE':
            discount = base_price * (offer.discount_value / Decimal('100'))
            if offer.max_discount_cap:
                discount = min(discount, offer.max_discount_cap)
            return discount
        elif offer.discount_type == 'FLAT_AMOUNT':
            return min(offer.discount_value, base_price)
        return Decimal('0')

    def _calculate_commission(self, amount, vendor, category):
        """Calculate commission for booking"""
        # Get commission config
        config = CommissionConfig.objects.filter(is_active=True).first()
        
        if not config:
            # Default 20%
            rate = Decimal('20.0')
        else:
            # Check category override
            if category in config.category_overrides:
                rate = Decimal(str(config.category_overrides[category]))
            # Check vendor custom rate
            elif str(vendor.id) in config.vendor_custom_rates:
                rate = Decimal(str(config.vendor_custom_rates[str(vendor.id)]))
            else:
                rate = config.default_commission_percentage
        
        commission = amount * (rate / Decimal('100'))
        payout = amount - commission
        
        return rate, commission, payout

