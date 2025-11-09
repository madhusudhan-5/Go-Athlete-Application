from django.views.generic import TemplateView
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import (
    VendorProfile, Transaction, Offer, OfferUsage,
    DailyAnalytics, CategoryAnalytics
)

@method_decorator(staff_member_required, name='dispatch')
class DashboardView(TemplateView):
    template_name = 'analytics/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

        # Overall platform metrics
        context['platform_metrics'] = {
            'total_revenue': Transaction.objects.filter(
                payment_status='COMPLETED'
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'total_commission': Transaction.objects.filter(
                payment_status='COMPLETED'
            ).aggregate(total=Sum('commission_amount'))['total'] or 0,
            'total_vendors': VendorProfile.objects.filter(
                is_active=True
            ).count(),
            'pending_approvals': VendorProfile.objects.filter(
                approval_status='PENDING'
            ).count()
        }

        # Category-wise revenue breakdown
        context['category_metrics'] = VendorProfile.objects.filter(
            transaction__payment_status='COMPLETED'
        ).values('vendor_type').annotate(
            total_revenue=Sum('transaction__amount'),
            total_commission=Sum('transaction__commission_amount'),
            total_bookings=Count('transaction')
        )

        # Weekly trends
        context['weekly_trends'] = Transaction.objects.filter(
            created_at__gte=start_date,
            payment_status='COMPLETED'
        ).annotate(
            week=TruncWeek('created_at')
        ).values('week').annotate(
            revenue=Sum('amount'),
            bookings=Count('id')
        ).order_by('week')

        # Recent registrations
        context['recent_registrations'] = VendorProfile.objects.order_by(
            '-registration_date'
        )[:10]

        # Offer performance
        context['offer_metrics'] = Offer.objects.annotate(
            usage_count=Count('offerusage'),
            total_discount=Sum('offerusage__discount_amount')
        ).values(
            'code', 'offer_type', 'usage_count', 'total_discount'
        )

        return context

@method_decorator(staff_member_required, name='dispatch')
class RevenueAnalyticsView(TemplateView):
    template_name = 'analytics/revenue.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=90)

        # Daily revenue trend
        context['daily_revenue'] = DailyAnalytics.objects.filter(
            date__gte=start_date
        ).values(
            'date', 'total_revenue', 'total_commission', 'net_vendor_earnings'
        ).order_by('date')

        # Category-wise monthly trends
        context['category_trends'] = CategoryAnalytics.objects.filter(
            date__gte=start_date
        ).values(
            'date', 'vendor_type', 'total_revenue', 'total_commission'
        ).order_by('date', 'vendor_type')

        return context

@method_decorator(staff_member_required, name='dispatch')
class VendorAnalyticsView(TemplateView):
    template_name = 'analytics/vendors.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Registration trends
        context['registration_trends'] = VendorProfile.objects.annotate(
            date=TruncDate('registration_date')
        ).values('date', 'vendor_type').annotate(
            count=Count('id')
        ).order_by('date')

        # Top performing vendors
        context['top_vendors'] = VendorProfile.objects.filter(
            transaction__payment_status='COMPLETED'
        ).annotate(
            total_revenue=Sum('transaction__amount'),
            total_bookings=Count('transaction')
        ).order_by('-total_revenue')[:10]

        return context