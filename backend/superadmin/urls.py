from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GlobalConfigViewSet, OfferViewSet, 
    AuditLogViewSet, VendorSummaryViewSet,
    VendorViewSet, CourtViewSet, CustomerViewSet,
    BookingViewSet, TicketViewSet, VenueViewSet, PayoutViewSet,
    AdminUserViewSet, VendorKYCViewSet, VendorOfferViewSet,
    CoachViewSet, CoachAvailabilityViewSet, CoachPackageViewSet, CoachingSessionViewSet,
    ProductViewSet, ProductVariantViewSet, OrderViewSet, OrderItemViewSet,
    MembershipViewSet, CustomerMembershipViewSet,
    send_sms, dashboard_stats, super_summary,
    global_config, auth_login, admin_dashboard,
    vendor_dashboard, vendor_analytics, generate_slots, create_booking, payout_summary, request_payout,
    admin_reports, vendor_register,
    admin_auth_me, admin_dashboard_summary, admin_commission_config,
    auth_refresh,
    super_auth_login, super_auth_refresh, super_auth_me,
    super_admins, super_admin_detail, super_admin_enable, super_admin_disable,
    super_system_config, super_commissions_history, super_commissions_override,
    super_analytics_summary, super_broadcast,
    super_offer_override, super_offer_deactivate, super_offer_delete,
    super_vendor_force_deactivate, super_vendor_force_reset, super_vendor_hard_delete,
    super_audit_logs
)
from .console_views import (
    console_login, console_logout, console_dashboard,
    console_global_config, console_offers, console_offer_add, console_offer_toggle, console_offer_edit,
    console_audit_logs, console_admin_users, console_admin_add, console_admin_toggle,
    console_vendors, console_vendor_approve, console_vendor_suspend,
    console_kyc, console_kyc_verify, console_kyc_reject,
    console_bookings, console_booking_complete, console_booking_cancel,
    console_customers, console_customer_detail,
    console_tickets, console_ticket_progress, console_ticket_resolve
)

router = DefaultRouter()
router.register(r'configs', GlobalConfigViewSet)
router.register(r'offers', OfferViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'vendor-summaries', VendorSummaryViewSet)
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'courts', CourtViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'payouts', PayoutViewSet, basename='payout')
router.register(r'admins', AdminUserViewSet, basename='admin-user')
router.register(r'kyc', VendorKYCViewSet, basename='kyc')

router.register(r'super/vendors', VendorViewSet, basename='super-vendor')
router.register(r'super/offers', OfferViewSet, basename='super-offer')
router.register(r'super/admins', AdminUserViewSet, basename='super-admin')
router.register(r'super/audit-logs', AuditLogViewSet, basename='super-audit-log')

router.register(r'admin/vendors', VendorViewSet, basename='admin-vendor')
router.register(r'admin/kyc', VendorKYCViewSet, basename='admin-kyc')
router.register(r'admin/bookings', BookingViewSet, basename='admin-booking')
router.register(r'admin/customers', CustomerViewSet, basename='admin-customer')
router.register(r'admin/tickets', TicketViewSet, basename='admin-ticket')

router.register(r'vendor/offers', VendorOfferViewSet, basename='vendor-offer')
router.register(r'vendor/coaches', CoachViewSet, basename='vendor-coach')
router.register(r'vendor/coach-availability', CoachAvailabilityViewSet, basename='vendor-coach-availability')
router.register(r'vendor/coach-packages', CoachPackageViewSet, basename='vendor-coach-package')
router.register(r'vendor/coaching-sessions', CoachingSessionViewSet, basename='vendor-coaching-session')
router.register(r'vendor/products', ProductViewSet, basename='vendor-product')
router.register(r'vendor/product-variants', ProductVariantViewSet, basename='vendor-product-variant')
router.register(r'vendor/orders', OrderViewSet, basename='vendor-order')
router.register(r'vendor/order-items', OrderItemViewSet, basename='vendor-order-item')
router.register(r'vendor/memberships', MembershipViewSet, basename='vendor-membership')
router.register(r'vendor/customer-memberships', CustomerMembershipViewSet, basename='vendor-customer-membership')

router.register(r'coaches', CoachViewSet, basename='coach')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'memberships', MembershipViewSet, basename='membership')
router.register(r'customer-memberships', CustomerMembershipViewSet, basename='customer-membership')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_login, name='auth-login'),
    path('auth/register/', vendor_register, name='vendor-register'),
    path('admin/auth/login/', auth_login, name='admin-auth-login'),
    path('admin/auth/refresh/', auth_refresh, name='admin-auth-refresh'),
    path('admin/auth/me/', admin_auth_me, name='admin-auth-me'),
    path('admin/dashboard/summary/', admin_dashboard_summary, name='admin-dashboard-summary'),
    path('admin/commission-config/', admin_commission_config, name='admin-commission-config'),
    path('send-sms/', send_sms, name='send-sms'),
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('super/summary/', super_summary, name='super-summary'),
    path('super/global-config/', global_config, name='super-global-config'),
    path('global-config/', global_config, name='global-config'),
    path('admin/summary/', admin_dashboard, name='admin-summary'),
    path('admin/reports/', admin_reports, name='admin-reports'),
    path('admin/reports/summary/', admin_reports, name='admin-reports-summary'),
    path('vendor/dashboard/', vendor_dashboard, name='vendor-dashboard'),
    path('vendor/analytics/', vendor_analytics, name='vendor-analytics'),
    path('vendor/slots/', generate_slots, name='generate-slots'),
    path('vendor/create-booking/', create_booking, name='create-booking'),
    path('vendor/payout-summary/', payout_summary, name='payout-summary'),
    path('vendor/request-payout/', request_payout, name='request-payout'),
    
    path('super/auth/login/', super_auth_login, name='super-auth-login'),
    path('super/auth/refresh/', super_auth_refresh, name='super-auth-refresh'),
    path('super/auth/me/', super_auth_me, name='super-auth-me'),
    
    path('super/admins/', super_admins, name='super-admins'),
    path('super/admins/<int:admin_id>/', super_admin_detail, name='super-admin-detail'),
    path('super/admins/<int:admin_id>/enable/', super_admin_enable, name='super-admin-enable'),
    path('super/admins/<int:admin_id>/disable/', super_admin_disable, name='super-admin-disable'),
    
    path('super/config/', super_system_config, name='super-system-config'),
    path('super/commissions/history/', super_commissions_history, name='super-commissions-history'),
    path('super/commissions/override/', super_commissions_override, name='super-commissions-override'),
    
    path('super/analytics/summary/', super_analytics_summary, name='super-analytics-summary'),
    path('super/broadcast/', super_broadcast, name='super-broadcast'),
    
    path('super/offers/<int:offer_id>/override/', super_offer_override, name='super-offer-override'),
    path('super/offers/<int:offer_id>/deactivate/', super_offer_deactivate, name='super-offer-deactivate'),
    path('super/offers/<int:offer_id>/', super_offer_delete, name='super-offer-delete'),
    
    path('super/vendors/<int:vendor_id>/force-deactivate/', super_vendor_force_deactivate, name='super-vendor-force-deactivate'),
    path('super/vendors/<int:vendor_id>/force-reset/', super_vendor_force_reset, name='super-vendor-force-reset'),
    path('super/vendors/<int:vendor_id>/', super_vendor_hard_delete, name='super-vendor-hard-delete'),
    
    path('super/audit-logs/', super_audit_logs, name='super-audit-logs'),
]

console_urlpatterns = [
    path('', console_login, name='console-login'),
    path('login/', console_login, name='console-login-alt'),
    path('logout/', console_logout, name='console-logout'),
    path('dashboard/', console_dashboard, name='console-dashboard'),
    path('global-config/', console_global_config, name='console-global-config'),
    path('offers/', console_offers, name='console-offers'),
    path('offers/add/', console_offer_add, name='console-offer-add'),
    path('offers/<int:offer_id>/toggle/', console_offer_toggle, name='console-offer-toggle'),
    path('offers/<int:offer_id>/edit/', console_offer_edit, name='console-offer-edit'),
    path('audit-logs/', console_audit_logs, name='console-audit-logs'),
    path('admin-users/', console_admin_users, name='console-admin-users'),
    path('admin-users/add/', console_admin_add, name='console-admin-add'),
    path('admin-users/<int:admin_id>/toggle/', console_admin_toggle, name='console-admin-toggle'),
    path('vendors/', console_vendors, name='console-vendors'),
    path('vendors/<int:vendor_id>/approve/', console_vendor_approve, name='console-vendor-approve'),
    path('vendors/<int:vendor_id>/suspend/', console_vendor_suspend, name='console-vendor-suspend'),
    path('kyc/', console_kyc, name='console-kyc'),
    path('kyc/<int:kyc_id>/verify/', console_kyc_verify, name='console-kyc-verify'),
    path('kyc/<int:kyc_id>/reject/', console_kyc_reject, name='console-kyc-reject'),
    path('bookings/', console_bookings, name='console-bookings'),
    path('bookings/<int:booking_id>/complete/', console_booking_complete, name='console-booking-complete'),
    path('bookings/<int:booking_id>/cancel/', console_booking_cancel, name='console-booking-cancel'),
    path('customers/', console_customers, name='console-customers'),
    path('customers/<int:customer_id>/', console_customer_detail, name='console-customer-detail'),
    path('tickets/', console_tickets, name='console-tickets'),
    path('tickets/<int:ticket_id>/progress/', console_ticket_progress, name='console-ticket-progress'),
    path('tickets/<int:ticket_id>/resolve/', console_ticket_resolve, name='console-ticket-resolve'),
]
