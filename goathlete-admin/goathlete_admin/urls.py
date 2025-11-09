"""
URL configuration for goathlete_admin project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from two_factor import urls as tf_urls


# Optional: Protect admin with OTP
from two_factor.admin import AdminSiteOTPRequired
admin.site.__class__ = AdminSiteOTPRequired

urlpatterns = [
    # --- Two-Factor Authentication URLs ---

    path('', include((tf_urls, 'two_factor'), namespace='two_factor')),

    # --- Django Admin ---
    path('admin/', admin.site.urls),

    # --- API URLs ---
    path('api/', include('api.urls')),                # Auth APIs
    path('api/v1/vendor/', include('bookings.urls')), # Booking APIs
    path('api/v1/payments/', include('payments.urls')),# Payment APIs
]

# --- Media & Static in Development ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
