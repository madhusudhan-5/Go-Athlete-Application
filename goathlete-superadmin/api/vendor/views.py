from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
from ..core.middleware.security import allowed_roles
from ..core.services.auth_service import AuthService
from .serializers import VendorSerializer, ServiceSerializer, BookingSerializer
from .models import Vendor, Service, Booking

class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'vendor':
            return Vendor.objects.filter(user=self.request.user)
        elif self.request.user.role in ['super_admin', 'admin']:
            return Vendor.objects.all()
        raise PermissionDenied()

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        vendor = self.get_object()
        if request.user.role != 'vendor' and request.user != vendor.user:
            raise PermissionDenied()
        # Return vendor analytics
        return Response(vendor.get_analytics())

class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'vendor':
            return Service.objects.filter(vendor__user=self.request.user)
        return Service.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != 'vendor':
            raise PermissionDenied()
        serializer.save(vendor=self.request.user.vendor)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            return Booking.objects.filter(service__vendor__user=user)
        elif user.role == 'customer':
            return Booking.objects.filter(customer=user)
        return Booking.objects.all()

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if request.user.role != 'vendor' or request.user != booking.service.vendor.user:
            raise PermissionDenied()
        booking.confirm()
        return Response({'status': 'confirmed'})