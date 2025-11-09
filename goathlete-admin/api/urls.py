from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views.auth import AuthViewSet
from .views.vendor import VendorDashboardViewSet
from .views.venues import VenueViewSet, CourtViewSet
from .views.offers import OfferViewSet
from .views.analytics import VendorAnalyticsViewSet, VendorFinancialViewSet
from .views.superadmin import (
    AdminManagementViewSet, OfferManagementViewSet, CommissionConfigViewSet,
    SuperAdminAnalyticsViewSet, AuditLogViewSet
)
from .views.admin import (
    VendorManagementViewSet, CustomerManagementViewSet, VendorOnboardingViewSet
)
from .views.coaches import (
    CoachViewSet, CoachAvailabilityViewSet, CoachPackageViewSet, CoachingSessionViewSet
)
from .views.ecommerce import (
    ProductViewSet, ProductVariantViewSet, OrderViewSet
)

router = DefaultRouter()
# Auth
router.register(r'auth', AuthViewSet, basename='auth')

# Vendor APIs
router.register(r'vendor/dashboard', VendorDashboardViewSet, basename='vendor-dashboard')
router.register(r'vendor/venues', VenueViewSet, basename='venue')
router.register(r'vendor/courts', CourtViewSet, basename='court')
router.register(r'vendor/offers', OfferViewSet, basename='offer')
router.register(r'vendor/analytics', VendorAnalyticsViewSet, basename='vendor-analytics')
router.register(r'vendor/financial', VendorFinancialViewSet, basename='vendor-financial')

# Super Admin APIs
router.register(r'super-admin/admins', AdminManagementViewSet, basename='super-admin-admins')
router.register(r'super-admin/offers', OfferManagementViewSet, basename='super-admin-offers')
router.register(r'super-admin/commission-config', CommissionConfigViewSet, basename='super-admin-commission')
router.register(r'super-admin/analytics', SuperAdminAnalyticsViewSet, basename='super-admin-analytics')
router.register(r'super-admin/audit-logs', AuditLogViewSet, basename='super-admin-audit-logs')

# Admin APIs
router.register(r'admin/vendors', VendorManagementViewSet, basename='admin-vendors')
router.register(r'admin/customers', CustomerManagementViewSet, basename='admin-customers')
router.register(r'admin/onboarding', VendorOnboardingViewSet, basename='admin-onboarding')

# Coach APIs
router.register(r'vendor/coaches', CoachViewSet, basename='coach')
router.register(r'vendor/coaches/(?P<coach_id>[^/.]+)/availability', CoachAvailabilityViewSet, basename='coach-availability')
router.register(r'vendor/coaches/(?P<coach_id>[^/.]+)/packages', CoachPackageViewSet, basename='coach-package')
router.register(r'vendor/coaching-sessions', CoachingSessionViewSet, basename='coaching-session')

# Ecommerce APIs
router.register(r'vendor/products', ProductViewSet, basename='product')
router.register(r'vendor/products/(?P<product_id>[^/.]+)/variants', ProductVariantViewSet, basename='product-variant')
router.register(r'vendor/orders', OrderViewSet, basename='order')

urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
