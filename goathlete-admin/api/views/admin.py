from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Sum
from datetime import datetime, timedelta

from accounts.models import User
from core.models import VendorProfile, AdminHierarchy
from bookings.models import Booking
from venues.models import Venue, Court


class AdminViewSet(viewsets.ViewSet):
    """
    Admin API endpoints
    """
    permission_classes = [IsAuthenticated]

    def check_admin_permission(self, request):
        """Check if user is Admin and has permission"""
        user = request.user
        if user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return False, None
        
        if user.role == 'SUPER_ADMIN':
            return True, None  # Super Admin has all permissions
        
        # Check admin hierarchy
        hierarchy = AdminHierarchy.objects.filter(admin_user=user).first()
        if not hierarchy:
            return False, None
        
        return True, hierarchy


class VendorManagementViewSet(AdminViewSet):
    """
    Vendor Management API for Admin
    GET /api/v1/admin/vendors/ - List vendors
    GET /api/v1/admin/vendors/{id}/ - Vendor detail
    PUT /api/v1/admin/vendors/{id}/approve/ - Approve vendor
    PUT /api/v1/admin/vendors/{id}/reject/ - Reject vendor
    PUT /api/v1/admin/vendors/{id}/suspend/ - Suspend vendor
    """
    
    def list(self, request):
        """List vendors"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Filter by approval status
        status_filter = request.query_params.get('status', None)
        queryset = VendorProfile.objects.all()
        
        if status_filter:
            queryset = queryset.filter(approval_status=status_filter)
        
        # If admin, filter by vendor_access
        if hierarchy and hierarchy.vendor_access:
            queryset = queryset.filter(id__in=hierarchy.vendor_access)
        
        vendors = queryset.select_related('user', 'approved_by', 'onboarded_by')
        data = []
        for vendor in vendors:
            data.append({
                'id': str(vendor.id),
                'business_name': vendor.business_name,
                'legal_name': vendor.legal_name,
                'vendor_type': vendor.vendor_type,
                'email': vendor.email,
                'phone_number': vendor.phone_number,
                'city': vendor.city,
                'state': vendor.state,
                'kyc_status': vendor.kyc_status,
                'approval_status': vendor.approval_status,
                'is_active': vendor.is_active,
                'total_bookings': vendor.total_bookings,
                'total_revenue': float(vendor.total_revenue),
                'avg_rating': float(vendor.avg_rating) if vendor.avg_rating else None,
                'created_at': vendor.created_at.isoformat()
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """Get vendor detail"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = VendorProfile.objects.get(id=pk)
            
            # Check vendor access if admin
            if hierarchy and hierarchy.vendor_access and str(vendor.id) not in hierarchy.vendor_access:
                return Response({'error': 'Access denied to this vendor'}, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'id': str(vendor.id),
                'business_name': vendor.business_name,
                'legal_name': vendor.legal_name,
                'vendor_type': vendor.vendor_type,
                'description': vendor.description,
                'email': vendor.email,
                'phone_number': vendor.phone_number,
                'address': vendor.address,
                'city': vendor.city,
                'state': vendor.state,
                'postal_code': vendor.postal_code,
                'country': vendor.country,
                'kyc_status': vendor.kyc_status,
                'kyc_document_url': vendor.kyc_document_url,
                'pan_number': vendor.pan_number,
                'gstin': vendor.gstin,
                'approval_status': vendor.approval_status,
                'is_active': vendor.is_active,
                'total_bookings': vendor.total_bookings,
                'total_revenue': float(vendor.total_revenue),
                'avg_rating': float(vendor.avg_rating) if vendor.avg_rating else None,
                'created_at': vendor.created_at.isoformat()
            }, status=status.HTTP_200_OK)
        
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['put'])
    def approve(self, request, pk=None):
        """Approve vendor"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = VendorProfile.objects.get(id=pk)
            
            # Check vendor access if admin
            if hierarchy and hierarchy.vendor_access and str(vendor.id) not in hierarchy.vendor_access:
                return Response({'error': 'Access denied to this vendor'}, status=status.HTTP_403_FORBIDDEN)
            
            vendor.approval_status = 'APPROVED'
            vendor.approved_at = timezone.now()
            vendor.approved_by = request.user
            vendor.is_active = True
            vendor.save()
            
            return Response({
                'id': str(vendor.id),
                'approval_status': vendor.approval_status,
                'message': 'Vendor approved successfully'
            }, status=status.HTTP_200_OK)
        
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        """Reject vendor"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = VendorProfile.objects.get(id=pk)
            
            # Check vendor access if admin
            if hierarchy and hierarchy.vendor_access and str(vendor.id) not in hierarchy.vendor_access:
                return Response({'error': 'Access denied to this vendor'}, status=status.HTTP_403_FORBIDDEN)
            
            rejection_reason = request.data.get('reason', '')
            vendor.approval_status = 'REJECTED'
            vendor.approved_at = timezone.now()
            vendor.approved_by = request.user
            vendor.is_active = False
            vendor.suspension_reason = rejection_reason
            vendor.save()
            
            return Response({
                'id': str(vendor.id),
                'approval_status': vendor.approval_status,
                'message': 'Vendor rejected'
            }, status=status.HTTP_200_OK)
        
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['put'])
    def suspend(self, request, pk=None):
        """Suspend vendor"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = VendorProfile.objects.get(id=pk)
            
            # Check vendor access if admin
            if hierarchy and hierarchy.vendor_access and str(vendor.id) not in hierarchy.vendor_access:
                return Response({'error': 'Access denied to this vendor'}, status=status.HTTP_403_FORBIDDEN)
            
            suspension_reason = request.data.get('reason', '')
            vendor.is_active = False
            vendor.suspension_reason = suspension_reason
            vendor.save()
            
            return Response({
                'id': str(vendor.id),
                'is_active': vendor.is_active,
                'message': 'Vendor suspended'
            }, status=status.HTTP_200_OK)
        
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)


class CustomerManagementViewSet(AdminViewSet):
    """
    Customer Management API for Admin
    GET /api/v1/admin/customers/ - List customers
    GET /api/v1/admin/customers/{id}/ - Customer detail
    """
    
    def list(self, request):
        """List customers"""
        has_permission, _ = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        customers = User.objects.filter(role='CUSTOMER').annotate(
            booking_count=Count('bookings'),
            total_spent=Sum('bookings__total_amount')
        )
        
        data = []
        for customer in customers:
            data.append({
                'id': str(customer.id),
                'email': customer.email,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'phone_number': customer.phone_number,
                'is_verified': customer.is_verified,
                'is_active': customer.is_active,
                'booking_count': customer.booking_count,
                'total_spent': float(customer.total_spent or 0),
                'created_at': customer.created_at.isoformat()
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """Get customer detail"""
        has_permission, _ = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            customer = User.objects.get(id=pk, role='CUSTOMER')
            bookings = Booking.objects.filter(customer_user=customer)
            
            return Response({
                'id': str(customer.id),
                'email': customer.email,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'phone_number': customer.phone_number,
                'is_verified': customer.is_verified,
                'is_active': customer.is_active,
                'total_bookings': bookings.count(),
                'total_spent': float(bookings.aggregate(total=Sum('total_amount'))['total'] or 0),
                'created_at': customer.created_at.isoformat()
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)


class VendorOnboardingViewSet(AdminViewSet):
    """
    Vendor Onboarding API for Admin
    GET /api/v1/admin/onboarding/pending/ - Get pending onboarding requests
    POST /api/v1/admin/onboarding/{vendor_id}/complete/ - Complete onboarding
    """
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending onboarding requests"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        queryset = VendorProfile.objects.filter(approval_status='PENDING')
        
        # If admin, filter by vendor_access
        if hierarchy and hierarchy.vendor_access:
            queryset = queryset.filter(id__in=hierarchy.vendor_access)
        
        vendors = queryset.select_related('user')
        data = []
        for vendor in vendors:
            data.append({
                'id': str(vendor.id),
                'business_name': vendor.business_name,
                'vendor_type': vendor.vendor_type,
                'email': vendor.email,
                'kyc_status': vendor.kyc_status,
                'created_at': vendor.created_at.isoformat()
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete vendor onboarding"""
        has_permission, hierarchy = self.check_admin_permission(request)
        if not has_permission:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            vendor = VendorProfile.objects.get(id=pk)
            
            # Check vendor access if admin
            if hierarchy and hierarchy.vendor_access and str(vendor.id) not in hierarchy.vendor_access:
                return Response({'error': 'Access denied to this vendor'}, status=status.HTTP_403_FORBIDDEN)
            
            vendor.approval_status = 'APPROVED'
            vendor.approved_at = timezone.now()
            vendor.approved_by = request.user
            vendor.onboarded_at = timezone.now()
            vendor.onboarded_by = request.user
            vendor.is_active = True
            vendor.save()
            
            return Response({
                'id': str(vendor.id),
                'message': 'Onboarding completed successfully'
            }, status=status.HTTP_200_OK)
        
        except VendorProfile.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)

