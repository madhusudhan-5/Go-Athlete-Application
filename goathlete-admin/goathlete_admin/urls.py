"""
URL configuration for goathlete_admin project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Optional: Protect admin with OTP

urlpatterns = [
    # --- Django Admin ---
    path('admin/', admin.site.urls),
    # --- API Endpoints ---
    path('api/', include('api.urls')),
    path('api/v1/vendor/', include('bookings.urls')),
    path('api/v1/payments/', include('payments.urls')),
]

# --- Static and Media ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
