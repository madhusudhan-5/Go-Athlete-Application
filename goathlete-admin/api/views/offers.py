from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from core.models import Offer
from api.serializers import OfferSerializer


class OfferViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Offer API for vendors (read-only, offers created by Super Admin/Admin)
    GET /api/v1/vendor/offers/ - List offers
    GET /api/v1/vendor/offers/{id}/ - Offer detail
    """
    permission_classes = [IsAuthenticated]
    queryset = Offer.objects.filter(is_active=True)
    serializer_class = OfferSerializer

    def get_queryset(self):
        """Filter offers applicable to vendor"""
        user = self.request.user
        if not hasattr(user, 'vendor_profile'):
            return Offer.objects.none()
        
        vendor = user.vendor_profile
        today = timezone.now().date()
        
        # Get offers for vendor's category
        category = vendor.vendor_type if vendor.vendor_type != 'HYBRID' else None
        
        queryset = Offer.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        )
        
        if category:
            queryset = queryset.filter(applicable_categories__contains=[category])
        else:
            # HYBRID vendors see all categories
            queryset = queryset.filter(
                applicable_categories__overlap=['VENUE', 'COACH', 'ECOMMERCE']
            )
        
        # Filter by vendor if specified
        vendor_specific = queryset.filter(applicable_vendor_ids__contains=[str(vendor.id)])
        if vendor_specific.exists():
            return vendor_specific
        
        # Otherwise return all applicable offers
        return queryset.filter(applicable_vendor_ids__isnull=True)

