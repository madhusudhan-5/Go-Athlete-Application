from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta

from accounts.models import User, AuditLog, LoginAttempt
from core.models import VendorProfile, Offer, CommissionConfig, AdminHierarchy
from bookings.models import Booking, Order
from venues.models import Venue, Court


class SuperAdminViewSet(viewsets.ViewSet):
    """
    Super Admin API endpoints
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Ensure user is Super Admin"""
        user = self.request.user
        if user.role != 'SUPER_ADMIN':
            return None
        return True


class AdminManagementViewSet(SuperAdminViewSet):
    """
    Admin User Management API
    GET/POST /api/v1/super-admin/admins/ - List/Create admin users
    GET/PUT/DELETE /api/v1/super-admin/admins/{id}/ - Admin detail/update/delete
    """
    
    def list(self, request):
        """List all admin users"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        admins = User.objects.filter(role='ADMIN').select_related('vendor_profile')
        data = []
        for admin in admins:
            hierarchy = AdminHierarchy.objects.filter(admin_user=admin).first()
            data.append({
                'id': str(admin.id),
                'email': admin.email,
                'first_name': admin.first_name,
                'last_name': admin.last_name,
                'is_active': admin.is_active,
                'is_verified': admin.is_verified,
                'created_at': admin.created_at.isoformat(),
                'vendor_access': hierarchy.vendor_access if hierarchy else [],
                'permissions': hierarchy.permissions if hierarchy else {}
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    def create(self, request):
        """Create new admin user"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        vendor_access = request.data.get('vendor_access', [])
        permissions = request.data.get('permissions', {})
        
        if not email or not password or not first_name or not last_name:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            admin = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='ADMIN',
                is_verified=True,
                is_staff=True,
                created_by=request.user
            )
            
            # Create admin hierarchy
            AdminHierarchy.objects.create(
                super_admin_user=request.user,
                admin_user=admin,
                vendor_access=vendor_access,
                permissions=permissions,
                assigned_by=request.user
            )
            
            return Response({
                'id': str(admin.id),
                'email': admin.email,
                'first_name': admin.first_name,
                'last_name': admin.last_name,
                'vendor_access': vendor_access,
                'permissions': permissions
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class OfferManagementViewSet(SuperAdminViewSet):
    """
    Offer Management API for Super Admin
    GET/POST /api/v1/super-admin/offers/ - List/Create offers
    GET/PUT/DELETE /api/v1/super-admin/offers/{id}/ - Offer detail/update/delete
    """
    
    def list(self, request):
        """List all offers"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        offers = Offer.objects.all().order_by('-created_at')
        data = []
        for offer in offers:
            data.append({
                'id': str(offer.id),
                'name': offer.name,
                'description': offer.description,
                'offer_type': offer.offer_type,
                'discount_type': offer.discount_type,
                'discount_value': float(offer.discount_value),
                'start_date': offer.start_date.isoformat() if offer.start_date else None,
                'end_date': offer.end_date.isoformat() if offer.end_date else None,
                'is_active': offer.is_active,
                'redemption_count': offer.redemption_count,
                'revenue_impact': float(offer.revenue_impact) if offer.revenue_impact else 0,
                'created_at': offer.created_at.isoformat() if hasattr(offer, 'created_at') else None
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    def create(self, request):
        """Create new offer"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            offer = Offer.objects.create(
                created_by=request.user,
                name=request.data.get('name'),
                description=request.data.get('description', ''),
                offer_type=request.data.get('offer_type', 'DISCOUNT'),
                discount_type=request.data.get('discount_type', 'PERCENTAGE'),
                discount_value=request.data.get('discount_value', 0),
                max_discount_cap=request.data.get('max_discount_cap'),
                minimum_booking_amount=request.data.get('minimum_booking_amount', 0),
                applicable_categories=request.data.get('applicable_categories', []),
                applicable_vendor_ids=request.data.get('applicable_vendor_ids', []),
                start_date=request.data.get('start_date'),
                end_date=request.data.get('end_date'),
                start_time=request.data.get('start_time'),
                end_time=request.data.get('end_time'),
                applicable_days_of_week=request.data.get('applicable_days_of_week', []),
                usage_limit_total=request.data.get('usage_limit_total'),
                usage_limit_per_customer=request.data.get('usage_limit_per_customer'),
                visibility_percentage=request.data.get('visibility_percentage', 100),
                is_active=request.data.get('is_active', True)
            )
            
            return Response({
                'id': str(offer.id),
                'name': offer.name,
                'message': 'Offer created successfully'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CommissionConfigViewSet(SuperAdminViewSet):
    """
    Commission Configuration API
    GET/POST /api/v1/super-admin/commission-config/ - Get/Create commission config
    PUT /api/v1/super-admin/commission-config/{id}/ - Update commission config
    """
    
    def list(self, request):
        """Get commission configuration"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        config = CommissionConfig.objects.filter(super_admin=request.user).first()
        if not config:
            # Create default config
            config = CommissionConfig.objects.create(
                super_admin=request.user,
                default_commission_percentage=20.0,
                payout_cycle='WEEKLY',
                minimum_payout_threshold=1000.0,
                tax_rate_gst=18.0,
                is_active=True
            )
        
        return Response({
            'id': str(config.id),
            'default_commission_percentage': float(config.default_commission_percentage),
            'category_overrides': config.category_overrides,
            'vendor_custom_rates': config.vendor_custom_rates,
            'payout_cycle': config.payout_cycle,
            'minimum_payout_threshold': float(config.minimum_payout_threshold),
            'tax_rate_gst': float(config.tax_rate_gst),
            'is_active': config.is_active
        }, status=status.HTTP_200_OK)
    
    def create(self, request):
        """Create or update commission configuration"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        config, created = CommissionConfig.objects.update_or_create(
            super_admin=request.user,
            defaults={
                'default_commission_percentage': request.data.get('default_commission_percentage', 20.0),
                'category_overrides': request.data.get('category_overrides', {}),
                'vendor_custom_rates': request.data.get('vendor_custom_rates', {}),
                'payout_cycle': request.data.get('payout_cycle', 'WEEKLY'),
                'minimum_payout_threshold': request.data.get('minimum_payout_threshold', 1000.0),
                'tax_rate_gst': request.data.get('tax_rate_gst', 18.0),
                'is_active': request.data.get('is_active', True)
            }
        )
        
        return Response({
            'id': str(config.id),
            'message': 'Commission configuration updated' if not created else 'Commission configuration created'
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


class SuperAdminAnalyticsViewSet(SuperAdminViewSet):
    """
    Super Admin Analytics API
    GET /api/v1/super-admin/analytics/ - Get platform analytics
    """
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get platform-wide analytics"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Total vendors
        total_vendors = VendorProfile.objects.count()
        active_vendors = VendorProfile.objects.filter(is_active=True).count()
        pending_approval = VendorProfile.objects.filter(approval_status='PENDING').count()
        
        # Total bookings
        total_bookings = Booking.objects.count()
        this_month_bookings = Booking.objects.filter(date__gte=month_start).count()
        today_bookings = Booking.objects.filter(date=today).count()
        
        # Revenue
        total_revenue = Booking.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        this_month_revenue = Booking.objects.filter(
            date__gte=month_start,
            payment_status='PAID'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Commission
        total_commission = Booking.objects.aggregate(total=Sum('commission_amount'))['total'] or 0
        this_month_commission = Booking.objects.filter(
            date__gte=month_start,
            payment_status='PAID'
        ).aggregate(total=Sum('commission_amount'))['total'] or 0
        
        # Active offers
        active_offers = Offer.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).count()
        
        # Top vendors by revenue
        top_vendors = VendorProfile.objects.annotate(
            revenue=Sum('venues__courts__bookings__total_amount')
        ).order_by('-revenue')[:5]
        
        return Response({
            'vendors': {
                'total': total_vendors,
                'active': active_vendors,
                'pending_approval': pending_approval
            },
            'bookings': {
                'total': total_bookings,
                'this_month': this_month_bookings,
                'today': today_bookings
            },
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(this_month_revenue),
                'commission_total': float(total_commission),
                'commission_this_month': float(this_month_commission)
            },
            'offers': {
                'active': active_offers
            },
            'top_vendors': [
                {
                    'id': str(v.id),
                    'business_name': v.business_name,
                    'revenue': float(v.revenue or 0)
                }
                for v in top_vendors
            ]
        }, status=status.HTTP_200_OK)


class AuditLogViewSet(SuperAdminViewSet):
    """
    Audit Log API
    GET /api/v1/super-admin/audit-logs/ - Get audit logs
    """
    
    def list(self, request):
        """Get audit logs"""
        if not self.get_queryset():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        logs = AuditLog.objects.all().order_by('-created_at')[:100]
        data = []
        for log in logs:
            data.append({
                'id': str(log.id),
                'user_email': log.user.email if log.user else None,
                'action': log.action,
                'entity_type': log.entity_type,
                'entity_id': str(log.entity_id) if log.entity_id else None,
                'ip_address': log.ip_address,
                'status': log.status,
                'created_at': log.created_at.isoformat()
            })
        
        return Response(data, status=status.HTTP_200_OK)

