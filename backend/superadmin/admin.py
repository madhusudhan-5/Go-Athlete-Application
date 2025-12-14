from django.contrib import admin
from .models import GlobalConfig, Offer, AuditLog, VendorSummary

@admin.register(GlobalConfig)
class GlobalConfigAdmin(admin.ModelAdmin):
    list_display = ['commission_percentage', 'payout_cycle', 'min_payout_threshold', 'updated_at']

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['title', 'offer_type', 'value', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'offer_type']
    search_fields = ['title', 'description']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource', 'created_at']
    list_filter = ['action', 'resource']
    search_fields = ['user', 'resource']

@admin.register(VendorSummary)
class VendorSummaryAdmin(admin.ModelAdmin):
    list_display = ['vendor_name', 'total_orders', 'total_revenue', 'rating', 'is_approved']
    list_filter = ['is_approved']
    search_fields = ['vendor_name']
