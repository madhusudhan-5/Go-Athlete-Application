from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from datetime import datetime, timedelta

from bookings.models import Booking
from venues.models import Court
from core.models import VendorProfile


class VendorAnalyticsViewSet(viewsets.ViewSet):
    """
    Vendor Analytics API
    GET /api/v1/vendor/analytics/ - Get analytics data
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get analytics data"""
        user = request.user
        if not hasattr(user, 'vendor_profile'):
            return Response(
                {'error': 'User is not associated with a vendor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        vendor = user.vendor_profile
        metric = request.query_params.get('metric', 'bookings')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        groupby = request.query_params.get('groupby', 'daily')
        
        # Default to last 30 days if not specified
        if not end_date:
            end_date = timezone.now().date()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get bookings for vendor
        bookings = Booking.objects.filter(
            court__venue__vendor=vendor,
            date__gte=start_date,
            date__lte=end_date
        )
        
        if metric == 'bookings':
            # Group by date
            if groupby == 'daily':
                data = []
                current_date = datetime.strptime(start_date, '%Y-%m-%d').date() if isinstance(start_date, str) else start_date
                end = datetime.strptime(end_date, '%Y-%m-%d').date() if isinstance(end_date, str) else end_date
                
                while current_date <= end:
                    day_bookings = bookings.filter(date=current_date)
                    day_revenue = day_bookings.aggregate(total=Sum('total_amount'))['total'] or 0
                    data.append({
                        'date': current_date.isoformat(),
                        'value': day_bookings.count(),
                        'revenue': float(day_revenue)
                    })
                    current_date += timedelta(days=1)
                
                total = bookings.count()
                daily_avg = total / max(1, (end - current_date).days + 1) if current_date <= end else 0
                
                # Calculate trend (compare first half vs second half)
                midpoint = len(data) // 2
                first_half_avg = sum(d['value'] for d in data[:midpoint]) / max(1, midpoint)
                second_half_avg = sum(d['value'] for d in data[midpoint:]) / max(1, len(data) - midpoint)
                trend = 'UP' if second_half_avg > first_half_avg else 'DOWN' if second_half_avg < first_half_avg else 'STABLE'
                
                # Top services (courts)
                top_services = bookings.values('court__name').annotate(
                    bookings_count=Count('id'),
                    revenue=Sum('total_amount')
                ).order_by('-bookings_count')[:5]
                
                return Response({
                    'metric': 'bookings',
                    'total': total,
                    'daily_average': round(daily_avg, 1),
                    'trend': trend,
                    'data': data,
                    'top_services': [
                        {
                            'name': item['court__name'],
                            'bookings': item['bookings_count'],
                            'revenue': float(item['revenue'] or 0)
                        }
                        for item in top_services
                    ]
                })
        
        elif metric == 'revenue':
            # Similar structure for revenue
            total_revenue = bookings.aggregate(total=Sum('total_amount'))['total'] or 0
            return Response({
                'metric': 'revenue',
                'total': float(total_revenue),
                'data': []  # TODO: Implement revenue breakdown
            })
        
        return Response({'error': 'Invalid metric'}, status=status.HTTP_400_BAD_REQUEST)


class VendorFinancialViewSet(viewsets.ViewSet):
    """
    Vendor Financial API
    GET /api/v1/vendor/financial/summary/ - Get financial summary
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial summary"""
        user = request.user
        if not hasattr(user, 'vendor_profile'):
            return Response(
                {'error': 'User is not associated with a vendor'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        vendor = user.vendor_profile
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period = request.query_params.get('period', 'MONTHLY')
        
        # Default to current month
        today = timezone.now().date()
        if not start_date:
            start_date = today.replace(day=1)
        if not end_date:
            end_date = today
        
        # Get bookings for period
        bookings = Booking.objects.filter(
            court__venue__vendor=vendor,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Calculate totals
        total_gross_revenue = bookings.aggregate(total=Sum('total_amount'))['total'] or 0
        total_commission = bookings.aggregate(total=Sum('commission_amount'))['total'] or 0
        total_refunds = bookings.filter(
            refund_status='PROCESSED'
        ).aggregate(total=Sum('refund_amount'))['total'] or 0
        net_revenue = total_gross_revenue - total_commission - total_refunds
        
        # Pending payout (paid but not yet processed)
        pending_payout = bookings.filter(
            payment_status='PAID',
            booking_status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('vendor_payout'))['total'] or 0
        
        # Daily breakdown
        breakdown = []
        current_date = datetime.strptime(start_date, '%Y-%m-%d').date() if isinstance(start_date, str) else start_date
        end = datetime.strptime(end_date, '%Y-%m-%d').date() if isinstance(end_date, str) else end_date
        
        while current_date <= end:
            day_bookings = bookings.filter(date=current_date)
            day_revenue = day_bookings.aggregate(total=Sum('total_amount'))['total'] or 0
            day_commission = day_bookings.aggregate(total=Sum('commission_amount'))['total'] or 0
            day_payout = day_bookings.aggregate(total=Sum('vendor_payout'))['total'] or 0
            
            breakdown.append({
                'date': current_date.isoformat(),
                'bookings': day_bookings.count(),
                'revenue': float(day_revenue),
                'commission': float(day_commission),
                'payout': float(day_payout)
            })
            current_date += timedelta(days=1)
        
        # Next payout date (based on vendor's payout frequency)
        from datetime import timedelta
        if vendor.payout_frequency == 'WEEKLY':
            next_payout = today + timedelta(days=(7 - today.weekday()))
        elif vendor.payout_frequency == 'MONTHLY':
            next_payout = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
        else:
            next_payout = today + timedelta(days=1)
        
        # Period name
        period_name = f"{start_date.strftime('%B %Y')}" if isinstance(start_date, datetime) else start_date
        
        return Response({
            'period': period_name,
            'total_gross_revenue': float(total_gross_revenue),
            'total_commission': float(total_commission),
            'total_refunds': float(total_refunds),
            'net_revenue': float(net_revenue),
            'total_payouts': float(net_revenue - pending_payout),
            'pending_payout': float(pending_payout),
            'next_payout_date': next_payout.isoformat(),
            'breakdown': breakdown
        }, status=status.HTTP_200_OK)

