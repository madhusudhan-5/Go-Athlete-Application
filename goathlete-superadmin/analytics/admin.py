from django.contrib import admin
from django.db.models import Sum, Count
from django.utils import timezone
from django.urls import reverse
from django.utils.html import format_html
from .models import (
    VendorProfile, Transaction, Offer, OfferUsage,
    DailyAnalytics, CategoryAnalytics
)

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'vendor_type', 'approval_status', 
                   'registration_date', 'commission_rate', 'total_revenue', 'is_active')
    list_filter = ('vendor_type', 'approval_status', 'is_active')
    search_fields = ('business_name', 'user__email')
    readonly_fields = ('registration_date',)
    
    def total_revenue(self, obj):
        total = Transaction.objects.filter(
            vendor=obj, 
            payment_status='COMPLETED'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        return f"₹{total:,.2f}"

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'vendor', 'amount', 'commission_amount', 
                   'payment_status', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'vendor__vendor_type')
    search_fields = ('booking_id', 'customer_name', 'vendor__business_name')
    date_hierarchy = 'created_at'

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('code', 'offer_type', 'value', 'valid_from', 'valid_until', 
                   'total_uses', 'is_active')
    list_filter = ('offer_type', 'is_active', 'vendor')
    search_fields = ('code', 'description')
    readonly_fields = ('total_uses',)

@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_revenue', 'total_commission', 
                   'net_vendor_earnings', 'total_bookings', 'new_customers')
    list_filter = ('date',)
    date_hierarchy = 'date'
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(CategoryAnalytics)
class CategoryAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'vendor_type', 'total_revenue', 
                   'total_commission', 'total_bookings')
    list_filter = ('vendor_type', 'date')
    date_hierarchy = 'date'

    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False