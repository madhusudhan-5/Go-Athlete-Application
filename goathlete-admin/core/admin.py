from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from .models import CommissionConfig, Offer, VendorProfile, Analytics
from guardian.admin import GuardedModelAdmin


class ActiveOfferFilter(SimpleListFilter):
    title = 'active status'
    parameter_name = 'is_active'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Active'),
            ('no', 'Inactive'),
        )

    def queryset(self, request, queryset):
        from django.utils import timezone
        now = timezone.now()
        
        if self.value() == 'yes':
            return queryset.filter(start_date__lte=now, end_date__gte=now, is_active=True)
        if self.value() == 'no':
            return queryset.filter(end_date__lt=now) | queryset.filter(is_active=False)


@admin.register(CommissionConfig)
class CommissionConfigAdmin(GuardedModelAdmin):
    list_display = ('super_admin', 'default_commission_percentage', 'payout_cycle', 'minimum_payout_threshold', 'is_active')
    list_filter = ('payout_cycle', 'is_active', 'created_at')
    search_fields = ('super_admin__email',)
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if not change:  # Only set super_admin on creation
            obj.super_admin = request.user
        super().save_model(request, obj, form, change)


@admin.register(Offer)
class OfferAdmin(GuardedModelAdmin):
    list_display = ('name', 'offer_type', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active')
    list_filter = ('offer_type', 'discount_type', ActiveOfferFilter, 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_by', 'created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(VendorProfile)
class VendorProfileAdmin(GuardedModelAdmin):
    list_display = ('business_name', 'vendor_type', 'email', 'approval_status', 'is_active', 'onboarded_at', 'commission_rate')
    list_filter = ('vendor_type', 'approval_status', 'is_active', 'onboarded_at')
    search_fields = ('business_name', 'legal_name', 'email', 'phone_number')
    readonly_fields = ('onboarded_at', 'approved_at', 'kyc_verified_at')

    def save_model(self, request, obj, form, change):
        if not change and not obj.onboarded_by:
            obj.onboarded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'vendor_type', 'total_bookings', 'total_revenue', 'commission_earned')
    list_filter = ('date', 'vendor_type')
    date_hierarchy = 'date'
    readonly_fields = ('date', 'vendor_type', 'total_bookings', 'total_revenue', 'commission_earned')