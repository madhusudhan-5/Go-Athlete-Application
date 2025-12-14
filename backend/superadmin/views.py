import os
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Sum, Count
from rest_framework_simplejwt.tokens import RefreshToken
from twilio.rest import Client
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from .notifications import send_booking_confirmation_email, send_vendor_approval_email, send_payout_processed_email
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

from datetime import datetime, timedelta, date
from .models import (
    GlobalConfig, Offer, AuditLog, VendorSummary, Vendor, Venue, Court, 
    Customer, Booking, Ticket, Payout, AdminUser, VendorKYC, Slot, VendorOffer,
    Coach, CoachAvailability, CoachPackage, CoachingSession,
    Product, ProductVariant, Order, OrderItem,
    Membership, CustomerMembership,
    SuperAdmin, SystemConfig, CommissionHistory, BroadcastMessage
)
from .serializers import (
    GlobalConfigSerializer, OfferSerializer, 
    AuditLogSerializer, AuditLogDetailSerializer,
    VendorSummarySerializer, SendSMSSerializer, LoginSerializer,
    VendorSerializer, VendorDetailSerializer, CourtSerializer,
    CustomerSerializer, BookingSerializer, BookingAdjustSerializer,
    TicketSerializer, TicketAssignSerializer,
    VenueSerializer, VenueCreateSerializer, CourtCreateSerializer,
    PayoutSerializer, SlotSerializer, AdminUserSerializer, AdminUserCreateSerializer,
    VendorKYCSerializer, VendorRejectSerializer, VendorSuspendSerializer,
    TicketNoteSerializer, ReportsSummarySerializer, VendorOfferSerializer,
    CoachSerializer, CoachCreateSerializer, CoachAvailabilitySerializer,
    CoachPackageSerializer, CoachingSessionSerializer, CoachingSessionCreateSerializer,
    ProductSerializer, ProductCreateSerializer, ProductVariantSerializer,
    OrderSerializer, OrderCreateSerializer, OrderItemSerializer,
    MembershipSerializer, MembershipCreateSerializer,
    CustomerMembershipSerializer, CustomerMembershipCreateSerializer,
    SuperAdminSerializer, SystemConfigSerializer, CommissionHistorySerializer,
    CommissionOverrideSerializer, BroadcastMessageSerializer, BroadcastCreateSerializer,
    AdminUserFullSerializer, AdminUserCreateBySuper, AdminPermissionsUpdateSerializer
)


class AuditLogPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class GlobalConfigViewSet(viewsets.ModelViewSet):
    queryset = GlobalConfig.objects.all()
    serializer_class = GlobalConfigSerializer


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = Offer.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        offer = self.get_object()
        old_status = offer.status
        offer.status = 'ACTIVE'
        offer.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Offer',
            resource_id=str(offer.id),
            old_values={'status': old_status},
            new_values={'status': 'ACTIVE'},
        )
        
        return Response({'status': 'ACTIVE'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        offer = self.get_object()
        old_status = offer.status
        offer.status = 'EXPIRED'
        offer.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Offer',
            resource_id=str(offer.id),
            old_values={'status': old_status},
            new_values={'status': 'EXPIRED'},
        )
        
        return Response({'status': 'EXPIRED'})


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AuditLogDetailSerializer
        return AuditLogSerializer


class VendorSummaryViewSet(viewsets.ModelViewSet):
    queryset = VendorSummary.objects.all()
    serializer_class = VendorSummarySerializer


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = AdminUser.objects.all()
    serializer_class = AdminUserSerializer
    pagination_class = AuditLogPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        return AdminUserSerializer

    def create(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            admin_user = AdminUser.objects.create(
                user=user,
                can_onboard_vendor=data.get('can_onboard_vendor', True),
                can_manage_bookings=data.get('can_manage_bookings', True),
                can_view_reports=data.get('can_view_reports', True)
            )
            
            AuditLog.objects.create(
                user=request.user.username,
                action='create',
                resource='AdminUser',
                resource_id=str(admin_user.id),
                new_values={'username': user.username, 'email': user.email},
            )
            
            return Response(AdminUserSerializer(admin_user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        admin_user = self.get_object()
        admin_user.is_suspended = True
        admin_user.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='AdminUser',
            resource_id=str(admin_user.id),
            old_values={'is_suspended': False},
            new_values={'is_suspended': True},
        )
        
        return Response({'status': 'suspended'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        admin_user = self.get_object()
        admin_user.is_suspended = False
        admin_user.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='AdminUser',
            resource_id=str(admin_user.id),
            old_values={'is_suspended': True},
            new_values={'is_suspended': False},
        )
        
        return Response({'status': 'active'})


class VendorKYCViewSet(viewsets.ModelViewSet):
    queryset = VendorKYC.objects.all().order_by('-created_at')
    serializer_class = VendorKYCSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = VendorKYC.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        kyc = self.get_object()
        old_status = kyc.status
        kyc.status = 'VERIFIED'
        kyc.verified_at = datetime.now()
        kyc.save()
        
        kyc.vendor.kyc_status = 'VERIFIED'
        kyc.vendor.kyc_verified = True
        kyc.vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='VendorKYC',
            resource_id=str(kyc.id),
            old_values={'status': old_status},
            new_values={'status': 'VERIFIED'},
        )
        
        return Response({'status': 'VERIFIED'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        kyc = self.get_object()
        reason = request.data.get('reason', '')
        if len(reason) < 10:
            return Response({'error': 'Reason must be at least 10 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = kyc.status
        kyc.status = 'REJECTED'
        kyc.rejection_reason = reason
        kyc.save()
        
        kyc.vendor.kyc_status = 'REJECTED'
        kyc.vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='VendorKYC',
            resource_id=str(kyc.id),
            old_values={'status': old_status},
            new_values={'status': 'REJECTED', 'rejection_reason': reason},
        )
        
        return Response({'status': 'REJECTED'})


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    pagination_class = AuditLogPagination

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VendorDetailSerializer
        return VendorSerializer

    def get_queryset(self):
        queryset = Vendor.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        vendor = self.get_object()
        old_status = vendor.status
        if old_status not in ['PENDING', 'REJECTED']:
            return Response({'error': 'Can only approve PENDING or REJECTED vendors'}, status=status.HTTP_400_BAD_REQUEST)
        vendor.status = 'APPROVED'
        vendor.kyc_verified = True
        vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Vendor',
            resource_id=str(vendor.id),
            old_values={'status': old_status},
            new_values={'status': 'APPROVED'},
        )
        
        return Response({'status': 'APPROVED'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        vendor = self.get_object()
        reason = request.data.get('reason', '')
        if len(reason) < 10:
            return Response({'error': 'Reason must be at least 10 characters'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = vendor.status
        vendor.status = 'REJECTED'
        vendor.rejection_reason = reason
        vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Vendor',
            resource_id=str(vendor.id),
            old_values={'status': old_status},
            new_values={'status': 'REJECTED', 'rejection_reason': reason},
        )
        
        return Response({'status': 'REJECTED'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        vendor = self.get_object()
        reason = request.data.get('reason', '')
        if len(reason) < 10:
            return Response({'error': 'Reason must be at least 10 characters'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = vendor.status
        vendor.status = 'SUSPENDED'
        vendor.suspension_reason = reason
        vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Vendor',
            resource_id=str(vendor.id),
            old_values={'status': old_status},
            new_values={'status': 'SUSPENDED', 'suspension_reason': reason},
        )
        
        return Response({'status': 'SUSPENDED'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        vendor = self.get_object()
        old_status = vendor.status
        vendor.status = 'APPROVED'
        vendor.suspension_reason = ''
        vendor.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Vendor',
            resource_id=str(vendor.id),
            old_values={'status': old_status},
            new_values={'status': 'APPROVED'},
        )
        
        return Response({'status': 'APPROVED'})


class CourtViewSet(viewsets.ModelViewSet):
    queryset = Court.objects.all()
    serializer_class = CourtSerializer

    def get_queryset(self):
        queryset = Court.objects.all()
        venue_id = self.request.query_params.get('venue')
        vendor = self.request.query_params.get('vendor')
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)
        elif vendor:
            queryset = queryset.filter(venue__vendor_id=vendor)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourtCreateSerializer
        return CourtSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        court = self.get_object()
        old_status = court.status
        court.status = 'ACTIVE'
        court.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Court',
            resource_id=str(court.id),
            old_values={'status': old_status},
            new_values={'status': 'ACTIVE'},
        )
        
        return Response({'status': 'ACTIVE'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        court = self.get_object()
        old_status = court.status
        court.status = 'INACTIVE'
        court.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Court',
            resource_id=str(court.id),
            old_values={'status': old_status},
            new_values={'status': 'INACTIVE'},
        )
        
        return Response({'status': 'INACTIVE'})


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = Customer.objects.all()
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = Booking.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingAdjustSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        old_data = {
            'status': booking.status,
            'amount': str(booking.amount),
            'adjusted_amount': str(booking.adjusted_amount) if booking.adjusted_amount else None,
        }
        
        booking.adjusted_amount = serializer.validated_data['adjusted_amount']
        booking.adjustment_reason = serializer.validated_data['adjustment_reason']
        booking.status = 'adjusted'
        booking.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Booking',
            resource_id=str(booking.id),
            old_values=old_data,
            new_values={
                'status': 'adjusted',
                'adjusted_amount': str(booking.adjusted_amount),
                'adjustment_reason': booking.adjustment_reason,
            },
        )
        
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        booking = self.get_object()
        old_status = booking.status
        
        booking.status = 'refunded'
        booking.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='refund',
            resource='Booking',
            resource_id=str(booking.id),
            old_values={'status': old_status},
            new_values={'status': 'refunded'},
        )
        
        return Response({'status': 'refunded', 'booking_id': booking.id})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        old_status = booking.status
        
        booking.status = 'cancelled'
        booking.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='cancel',
            resource='Booking',
            resource_id=str(booking.id),
            old_values={'status': old_status},
            new_values={'status': 'cancelled'},
        )
        
        return Response({'status': 'cancelled', 'booking_id': booking.id})

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        booking = self.get_object()
        old_status = booking.status
        new_date = request.data.get('new_date')
        new_start = request.data.get('new_start_time')
        new_end = request.data.get('new_end_time')
        
        if new_date:
            booking.booking_date = new_date
        if new_start:
            booking.start_time = new_start
        if new_end:
            booking.end_time = new_end
        booking.status = 'rescheduled'
        booking.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='reschedule',
            resource='Booking',
            resource_id=str(booking.id),
            old_values={'status': old_status},
            new_values={'status': 'rescheduled', 'new_date': new_date},
        )
        
        return Response({'status': 'rescheduled', 'booking_id': booking.id})


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = Ticket.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if not admin_id:
            return Response({'error': 'admin_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            admin_user = AdminUser.objects.get(id=admin_id)
        except AdminUser.DoesNotExist:
            return Response({'error': 'Admin user not found'}, status=status.HTTP_404_NOT_FOUND)
        
        old_assigned = ticket.assigned_to_id
        old_status = ticket.status
        ticket.assigned_to = admin_user
        ticket.status = 'IN_PROGRESS'
        ticket.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Ticket',
            resource_id=str(ticket.id),
            old_values={'assigned_to': old_assigned, 'status': old_status},
            new_values={'assigned_to': admin_id, 'status': 'IN_PROGRESS'},
        )
        
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        old_status = ticket.status
        notes = request.data.get('notes', '')
        
        ticket.status = 'RESOLVED'
        if notes:
            ticket.resolution_notes = notes
        ticket.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='resolve',
            resource='Ticket',
            resource_id=str(ticket.id),
            old_values={'status': old_status},
            new_values={'status': 'RESOLVED', 'resolution_notes': notes},
        )
        
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_status == 'ESCALATED' and ticket.status not in ['OPEN', 'IN_PROGRESS']:
            return Response({'error': 'Can only escalate from OPEN or IN_PROGRESS'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = new_status
        ticket.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Ticket',
            resource_id=str(ticket.id),
            old_values={'status': old_status},
            new_values={'status': new_status},
        )
        
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='add-note')
    def add_note(self, request, pk=None):
        ticket = self.get_object()
        note_text = request.data.get('note', '')
        
        if not note_text:
            return Response({'error': 'Note text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        notes = ticket.notes or []
        notes.append({
            'user': request.user.username,
            'text': note_text,
            'created_at': datetime.now().isoformat()
        })
        ticket.notes = notes
        ticket.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Ticket',
            resource_id=str(ticket.id),
            new_values={'note_added': note_text},
        )
        
        return Response(TicketSerializer(ticket).data)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
        user = authenticate(username=user.username, password=password)
    except User.DoesNotExist:
        user = authenticate(username=email, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    
    role = 'ADMIN'
    if user.is_superuser:
        role = 'SUPER_ADMIN'
    elif hasattr(user, 'admin_profile'):
        role = 'ADMIN'
    
    AuditLog.objects.create(
        user=user.username,
        action='login',
        resource='Auth',
        details={'email': email, 'role': role}
    )

    vendor = None
    vendor_data = None
    if hasattr(user, 'vendor_profile'):
        vendor = user.vendor_profile
        vendor_data = {
            'id': vendor.id,
            'business_name': vendor.business_name,
            'vendor_type': vendor.vendor_type,
            'status': vendor.status,
        }
        role = 'VENDOR'

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': role,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        },
        'vendor': vendor_data,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def vendor_register(request):
    data = request.data
    
    required_fields = ['owner_name', 'business_name', 'phone', 'email', 'password', 'vendor_type']
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    password = data.get('password', '')
    if not password or len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
    
    confirm_password = data.get('confirm_password')
    if confirm_password and password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    email = data.get('email')
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
    
    if Vendor.objects.filter(email=email).exists():
        return Response({'error': 'Vendor with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    phone = data.get('phone')
    if len(phone) < 10:
        return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)
    
    vendor_type = data.get('vendor_type', 'VENUE')
    valid_types = ['VENUE', 'COACH', 'ECOM', 'VENUE_COACH', 'VENUE_ECOM', 'COACH_ECOM', 'ALL']
    if vendor_type not in valid_types:
        return Response({'error': 'Invalid vendor type'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=data.get('owner_name', '').split()[0] if data.get('owner_name') else '',
        last_name=' '.join(data.get('owner_name', '').split()[1:]) if data.get('owner_name') else '',
    )
    
    vendor = Vendor.objects.create(
        user=user,
        name=data.get('owner_name'),
        owner_name=data.get('owner_name'),
        legal_name=data.get('legal_name', data.get('business_name', '')),
        email=email,
        phone=phone,
        business_name=data.get('business_name'),
        business_type=data.get('business_type', 'Sports Facility'),
        vendor_type=vendor_type,
        address=data.get('address', ''),
        city=data.get('city', ''),
        state=data.get('state', ''),
        id_proof_1_type=data.get('id_proof_1_type', ''),
        id_proof_1_url=data.get('id_proof_1_url', ''),
        id_proof_2_type=data.get('id_proof_2_type', ''),
        id_proof_2_url=data.get('id_proof_2_url', ''),
        license_proof_url=data.get('license_proof_url', ''),
        status='PENDING',
        kyc_status='NOT_SUBMITTED',
    )
    
    VendorKYC.objects.create(
        vendor=vendor,
        status='PENDING',
    )
    
    refresh = RefreshToken.for_user(user)
    
    AuditLog.objects.create(
        user=user.username,
        action='register',
        resource='Vendor',
        resource_id=str(vendor.id),
        details={'email': email, 'vendor_type': vendor.vendor_type}
    )
    
    return Response({
        'message': 'Registration successful. Your account is pending approval.',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'vendor': {
            'id': vendor.id,
            'business_name': vendor.business_name,
            'vendor_type': vendor.vendor_type,
            'status': vendor.status,
        },
        'user': {
            'id': user.id,
            'email': user.email,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_sms(request):
    to = request.data.get('to')
    message = request.data.get('message')
    
    if not to or not message:
        return Response({'error': 'invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    
    if os.getenv('SMS_MODE', 'LOG') == 'LOG':
        print(f"SMS log: {to} {message}")
        AuditLog.objects.create(
            user=request.user.username,
            action='sms_sent',
            resource='SMS',
            details={'to': to, 'mode': 'LOG'}
        )
        return Response({'status': 'logged'})
    
    try:
        client = Client(os.environ['TWILIO_SID'], os.environ['TWILIO_TOKEN'])
        msg = client.messages.create(
            body=message,
            from_=os.environ['TWILIO_FROM'],
            to=to
        )
        AuditLog.objects.create(
            user=request.user.username,
            action='sms_sent',
            resource='SMS',
            details={'to': to, 'sid': msg.sid}
        )
        return Response({'sid': msg.sid})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_summary(request):
    total_revenue = Booking.objects.filter(status='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or 0
    total_bookings = Booking.objects.count()
    total_vendors = Vendor.objects.count()
    active_vendors = Vendor.objects.filter(status='APPROVED').count()
    pending_approvals = Vendor.objects.filter(status='PENDING').count()
    today = date.today()
    today_bookings = Booking.objects.filter(start_time__date=today).count()

    return Response({
        'total_revenue': float(total_revenue),
        'total_bookings': total_bookings,
        'total_vendors': total_vendors,
        'active_vendors': active_vendors,
        'pending_vendor_approvals': pending_approvals,
        'today_bookings': today_bookings,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    stats = {
        'total_offers': Offer.objects.count(),
        'active_offers': Offer.objects.filter(status='ACTIVE').count(),
        'total_vendors': Vendor.objects.count(),
        'total_audit_logs': AuditLog.objects.count(),
        'recent_logs': AuditLogSerializer(AuditLog.objects.all()[:5], many=True).data,
    }
    return Response(stats)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def global_config(request):
    config = GlobalConfig.get_config()

    if request.method == 'GET':
        serializer = GlobalConfigSerializer(config)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        old_data = GlobalConfigSerializer(config).data
        serializer = GlobalConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            AuditLog.objects.create(
                user=request.user.username,
                action='update',
                resource='GlobalConfig',
                resource_id='1',
                old_values=old_data,
                new_values=serializer.data,
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    pending_vendors = Vendor.objects.filter(status='PENDING').count()
    pending_kyc = VendorKYC.objects.filter(status='PENDING').count()
    open_tickets = Ticket.objects.filter(status='OPEN').count()
    total_bookings = Booking.objects.count()
    today = date.today()
    today_bookings = Booking.objects.filter(start_time__date=today).count()
    
    return Response({
        'pending_vendors': pending_vendors,
        'pending_kyc': pending_kyc,
        'open_tickets': open_tickets,
        'total_bookings': total_bookings,
        'today_bookings': today_bookings,
        'recent_tickets': TicketSerializer(Ticket.objects.filter(status='OPEN')[:5], many=True).data,
        'pending_vendor_list': VendorSerializer(Vendor.objects.filter(status='PENDING')[:5], many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports(request):
    from_date = request.query_params.get('from')
    to_date = request.query_params.get('to')
    format_type = request.query_params.get('format', 'json')
    
    bookings = Booking.objects.all()
    
    if from_date:
        bookings = bookings.filter(start_time__date__gte=from_date)
    if to_date:
        bookings = bookings.filter(start_time__date__lte=to_date)
    
    bookings_count = bookings.count()
    cancellations_count = bookings.filter(status='CANCELLED').count()
    completed_count = bookings.filter(status='COMPLETED').count()
    total_revenue = bookings.filter(status='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or 0
    
    if format_type == 'csv':
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="admin_report_{from_date or "all"}_{to_date or "all"}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Metric', 'Value'])
        writer.writerow(['Date Range', f'{from_date or "All"} to {to_date or "All"}'])
        writer.writerow(['Total Bookings', bookings_count])
        writer.writerow(['Completed Bookings', completed_count])
        writer.writerow(['Cancellations', cancellations_count])
        writer.writerow(['Total Revenue', f'{float(total_revenue):.2f}'])
        
        writer.writerow([])
        writer.writerow(['Booking ID', 'Customer', 'Court', 'Date', 'Status', 'Amount'])
        for booking in bookings[:100]:
            writer.writerow([
                booking.id,
                booking.customer_name,
                booking.court.name if booking.court else '',
                booking.start_time.date() if booking.start_time else '',
                booking.status,
                float(booking.amount)
            ])
        
        return response
    
    return Response({
        'bookings_count': bookings_count,
        'cancellations_count': cancellations_count,
        'completed_count': completed_count,
        'total_revenue': float(total_revenue),
        'date_range': {
            'from': from_date,
            'to': to_date
        }
    })


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = Venue.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VenueCreateSerializer
        return VenueSerializer

    def perform_create(self, serializer):
        try:
            vendor = Vendor.objects.get(user=self.request.user)
        except Vendor.DoesNotExist:
            raise ValidationError("Vendor profile not found")
        serializer.save(vendor=vendor)


    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        venue = self.get_object()
        old_status = venue.status
        venue.status = 'ACTIVE'
        venue.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Venue',
            resource_id=str(venue.id),
            old_values={'status': old_status},
            new_values={'status': 'ACTIVE'},
        )
        
        return Response({'status': 'ACTIVE'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        venue = self.get_object()
        old_status = venue.status
        venue.status = 'INACTIVE'
        venue.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Venue',
            resource_id=str(venue.id),
            old_values={'status': old_status},
            new_values={'status': 'INACTIVE'},
        )
        
        return Response({'status': 'INACTIVE'})


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer
    pagination_class = AuditLogPagination

    def get_queryset(self):
        queryset = Payout.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        return queryset

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_dashboard(request):
    vendor_id = request.query_params.get('vendor_id')

    # logged-in user
    user = request.user     

    # Vendor instance
    if hasattr(user, 'vendor_profile'):
        vendor = user.vendor_profile
    else:
        return Response({'error': 'Not a vendor user'}, status=401)

    total_venues = Venue.objects.filter(vendor=vendor).count()
    total_courts = Court.objects.filter(venue__vendor=vendor).count()
    total_bookings = Booking.objects.filter(court__venue__vendor=vendor).count()

    today = date.today()
    today_bookings = Booking.objects.filter(
        court__venue__vendor=vendor,
        start_time__date=today
    ).count()

    revenue = Booking.objects.filter(
        court__venue__vendor=vendor,
        status__in=['CONFIRMED', 'COMPLETED']
    ).aggregate(total=Sum('amount'))['total'] or 0

    pending_payout = 0
    if vendor_id:
        try:
            v = Vendor.objects.get(pk=vendor_id)
            pending_payout = Payout.objects.filter(
                vendor=v,
                status='pending'
            ).aggregate(total=Sum('net_amount'))['total'] or 0
        except Vendor.DoesNotExist:
            pass

    return Response({
        'vendor_id': vendor.id,
        'business_name': vendor.business_name,
        'vendor_type': vendor.vendor_type,
        'total_venues': total_venues,
        'total_courts': total_courts,
        'total_bookings': total_bookings,
        'today_bookings': today_bookings,
        'total_revenue': float(revenue),
        'pending_payout': float(pending_payout),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_analytics(request):
    vendor_id = request.query_params.get('vendor_id')
    period = request.query_params.get('period', 'week')
    
    if not vendor_id:
        return Response({'error': 'vendor_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        vendor = Vendor.objects.get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    today = date.today()
    if period == 'week':
        start_date = today - timedelta(days=7)
    elif period == 'month':
        start_date = today - timedelta(days=30)
    elif period == 'year':
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=7)
    
    vendor_user = User.objects.filter(email=vendor.email).first()
    
    if vendor_user:
        bookings = Booking.objects.filter(
            court__venue__vendor=vendor_user,
            start_time__date__gte=start_date,
            start_time__date__lte=today
        )
    else:
        bookings = Booking.objects.none()
    
    total_bookings = bookings.count()
    completed_bookings = bookings.filter(status='COMPLETED').count()
    cancelled_bookings = bookings.filter(status='CANCELLED').count()
    pending_bookings = bookings.filter(status__in=['PENDING', 'CONFIRMED']).count()
    
    booking_revenue = bookings.filter(
        status__in=['CONFIRMED', 'COMPLETED']
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    orders = Order.objects.filter(
        vendor=vendor,
        created_at__date__gte=start_date,
        created_at__date__lte=today
    )
    
    order_revenue = orders.filter(
        status__in=['DELIVERED', 'COMPLETED']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    total_revenue = float(booking_revenue) + float(order_revenue)
    
    prev_start = start_date - (today - start_date)
    if vendor_user:
        prev_booking_revenue = Booking.objects.filter(
            court__venue__vendor=vendor_user,
            start_time__date__gte=prev_start,
            start_time__date__lt=start_date,
            status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('amount'))['total'] or 0
    else:
        prev_booking_revenue = 0
    
    prev_order_revenue = Order.objects.filter(
        vendor=vendor,
        created_at__date__gte=prev_start,
        created_at__date__lt=start_date,
        status__in=['DELIVERED', 'COMPLETED']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    prev_total = float(prev_booking_revenue) + float(prev_order_revenue)
    revenue_change = ((total_revenue - prev_total) / prev_total * 100) if prev_total > 0 else 0
    
    trend = []
    if period == 'week':
        for i in range(7):
            day = today - timedelta(days=6-i)
            if vendor_user:
                day_revenue = Booking.objects.filter(
                    court__venue__vendor=vendor_user,
                    start_time__date=day,
                    status__in=['CONFIRMED', 'COMPLETED']
                ).aggregate(total=Sum('amount'))['total'] or 0
            else:
                day_revenue = 0
            trend.append(float(day_revenue))
    else:
        days = 30 if period == 'month' else 12
        for i in range(days):
            if period == 'month':
                day = today - timedelta(days=days-1-i)
                if vendor_user:
                    day_revenue = Booking.objects.filter(
                        court__venue__vendor=vendor_user,
                        start_time__date=day,
                        status__in=['CONFIRMED', 'COMPLETED']
                    ).aggregate(total=Sum('amount'))['total'] or 0
                else:
                    day_revenue = 0
            else:
                month_start = today.replace(day=1) - timedelta(days=30*(11-i))
                month_end = month_start + timedelta(days=30)
                if vendor_user:
                    day_revenue = Booking.objects.filter(
                        court__venue__vendor=vendor_user,
                        start_time__date__gte=month_start,
                        start_time__date__lt=month_end,
                        status__in=['CONFIRMED', 'COMPLETED']
                    ).aggregate(total=Sum('amount'))['total'] or 0
                else:
                    day_revenue = 0
            trend.append(float(day_revenue))
    
    products_sold = OrderItem.objects.filter(
        order__vendor=vendor,
        order__created_at__date__gte=start_date,
        order__status__in=['DELIVERED', 'COMPLETED']
    ).aggregate(total=Sum('quantity'))['total'] or 0
    
    product_revenue = float(order_revenue)
    
    top_products_list = []
    products = Product.objects.filter(vendor=vendor)[:10]
    for product in products:
        sold = OrderItem.objects.filter(
            product=product,
            order__created_at__date__gte=start_date,
            order__status__in=['DELIVERED', 'COMPLETED']
        ).aggregate(total=Sum('quantity'))['total'] or 0
        revenue = OrderItem.objects.filter(
            product=product,
            order__created_at__date__gte=start_date,
            order__status__in=['DELIVERED', 'COMPLETED']
        ).aggregate(total=Sum('subtotal'))['total'] or 0
        if sold > 0:
            top_products_list.append({
                'name': product.name,
                'sold': sold,
                'revenue': float(revenue)
            })
    top_products_list = sorted(top_products_list, key=lambda x: x['sold'], reverse=True)[:5]
    
    total_customers = Customer.objects.count()
    new_customers = Customer.objects.filter(
        created_at__date__gte=start_date
    ).count()
    returning_customers = total_customers - new_customers if total_customers > new_customers else 0
    
    return Response({
        'revenue': {
            'total': total_revenue,
            'trend': trend,
            'change': round(revenue_change, 1),
        },
        'bookings': {
            'total': total_bookings,
            'completed': completed_bookings,
            'cancelled': cancelled_bookings,
            'pending': pending_bookings,
        },
        'products': {
            'totalSold': products_sold,
            'revenue': product_revenue,
            'topProducts': top_products_list,
        },
        'customers': {
            'total': total_customers,
            'returning': returning_customers,
            'new': new_customers,
        },
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def generate_slots(request, court_id=None):
    if request.method == 'GET':
        court_id = request.query_params.get('court_id')
        date_str = request.query_params.get('date')
        
        if not court_id or not date_str:
            return Response({'error': 'court_id and date required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            court = Court.objects.get(pk=court_id)
            slot_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (Court.DoesNotExist, ValueError):
            return Response({'error': 'Invalid court_id or date'}, status=status.HTTP_400_BAD_REQUEST)
        
        venue = court.venue
        opening = datetime.combine(slot_date, venue.opening_time)
        closing = datetime.combine(slot_date, venue.closing_time)
        
        slot_duration = timedelta(minutes=court.slot_duration)
        
        existing_bookings = Booking.objects.filter(
            court=court,
            start_time__date=slot_date,
            status__in=['PENDING', 'CONFIRMED']
        )
        
        booked_times = [(b.start_time.time(), b.end_time.time()) for b in existing_bookings]
        
        slots = []
        current = opening
        while current + slot_duration <= closing:
            slot_start = current.time()
            slot_end = (current + slot_duration).time()
            
            is_available = True
            for booked_start, booked_end in booked_times:
                if not (slot_end <= booked_start or slot_start >= booked_end):
                    is_available = False
                    break
            
            slots.append({
                'date': slot_date,
                'start_time': slot_start,
                'end_time': slot_end,
                'is_available': is_available,
                'court_id': court.id,
                'court_name': court.name,
                'price': court.base_price,
            })
            
            current += slot_duration
        
        return Response(slots)
    
    else:
        court_id = court_id or request.data.get('court_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        slot_minutes = int(request.data.get('slot_minutes', 60))
        start_time_str = request.data.get('start_time', '06:00')
        end_time_str = request.data.get('end_time', '22:00')
        should_save = request.data.get('save', False)
        
        if not all([court_id, start_date, end_date]):
            return Response({'error': 'court_id, start_date, end_date required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            court = Court.objects.get(pk=court_id)
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            day_start = datetime.strptime(start_time_str, '%H:%M').time()
            day_end = datetime.strptime(end_time_str, '%H:%M').time()
        except (Court.DoesNotExist, ValueError) as e:
            return Response({'error': f'Invalid data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        slots = []
        current_date = start
        slot_duration = timedelta(minutes=slot_minutes)
        
        while current_date <= end:
            current_time = datetime.combine(current_date, day_start)
            end_datetime = datetime.combine(current_date, day_end)
            
            while current_time + slot_duration <= end_datetime:
                slot_start = current_time.time()
                slot_end = (current_time + slot_duration).time()
                
                slots.append({
                    'date': current_date,
                    'start_time': slot_start,
                    'end_time': slot_end,
                    'is_available': True,
                    'court_id': court.id,
                    'court_name': court.name,
                    'price': court.base_price,
                })
                
                current_time += slot_duration
            
            current_date += timedelta(days=1)
        
        if should_save:
            from .models import Slot
            created_count = 0
            for slot_data in slots:
                Slot.objects.update_or_create(
                    court=court,
                    date=slot_data['date'],
                    start_time=slot_data['start_time'],
                    defaults={
                        'end_time': slot_data['end_time'],
                        'is_available': True,
                        'price': court.base_price,
                    }
                )
                created_count += 1
            
            return Response({
                'status': 'saved',
                'slots_created': created_count,
                'slots': slots
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'preview',
            'slots': slots
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    court_id = request.data.get('court_id')
    customer_name = request.data.get('customer_name')
    customer_phone = request.data.get('customer_phone', '')
    customer_email = request.data.get('customer_email', '')
    booking_date = request.data.get('date')
    start_time_str = request.data.get('start_time')
    end_time_str = request.data.get('end_time')
    
    if not all([court_id, customer_name, booking_date, start_time_str, end_time_str]):
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        court = Court.objects.get(pk=court_id)
        booking_dt = datetime.strptime(booking_date, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time_str, '%H:%M').time()
        end_time = datetime.strptime(end_time_str, '%H:%M').time()
    except (Court.DoesNotExist, ValueError) as e:
        return Response({'error': f'Invalid data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    start_dt = datetime.combine(booking_dt, start_time)
    end_dt = datetime.combine(booking_dt, end_time)
    
    duration_hours = (end_dt - start_dt).seconds / 3600
    amount = float(court.base_price) * duration_hours
    
    booking = Booking.objects.create(
        court=court,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        start_time=start_dt,
        end_time=end_dt,
        amount=amount,
        status='CONFIRMED',
        payment_status='UNPAID'
    )
    
    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_summary(request):
    vendor_id = request.query_params.get('vendor_id')
    user = request.user
    
    if vendor_id:
        try:
            vendor = Vendor.objects.get(pk=vendor_id)
            total_earned = Booking.objects.filter(
                court__venue__vendor__username=vendor.email,
                status__in=['CONFIRMED', 'COMPLETED']
            ).aggregate(total=Sum('amount'))['total'] or 0
            recent_payouts = Payout.objects.filter(vendor=vendor)[:5]
            total_paid = Payout.objects.filter(
                vendor=vendor,
                status='completed'
            ).aggregate(total=Sum('net_amount'))['total'] or 0
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        total_earned = Booking.objects.filter(
            court__venue__vendor=user,
            status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('amount'))['total'] or 0
        recent_payouts = []
        total_paid = 0
    
    config = GlobalConfig.get_config()
    commission_rate = float(config.commission_percentage) / 100
    
    total_commission = float(total_earned) * commission_rate
    net_earnings = float(total_earned) - total_commission
    
    pending_payout = net_earnings - float(total_paid)
    
    return Response({
        'total_earned': float(total_earned),
        'total_commission': total_commission,
        'net_earnings': net_earnings,
        'total_paid': float(total_paid),
        'pending_payout': pending_payout,
        'commission_rate': float(config.commission_percentage),
        'recent_payouts': PayoutSerializer(recent_payouts, many=True).data if recent_payouts else [],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_payout(request):
    vendor_id = request.data.get('vendor_id')
    if not vendor_id:
        return Response({'error': 'vendor_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        vendor = Vendor.objects.get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    total_earned = Booking.objects.filter(
        court__venue__vendor__username=vendor.email,
        status__in=['CONFIRMED', 'COMPLETED']
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    config = GlobalConfig.get_config()
    commission_rate = float(config.commission_percentage) / 100
    
    total_commission = float(total_earned) * commission_rate
    net_earnings = float(total_earned) - total_commission
    
    total_paid = Payout.objects.filter(
        vendor=vendor,
        status='completed'
    ).aggregate(total=Sum('net_amount'))['total'] or 0
    
    pending_amount = net_earnings - float(total_paid)
    
    if pending_amount <= 0:
        return Response({'error': 'No pending amount to request'}, status=status.HTTP_400_BAD_REQUEST)
    
    payout = Payout.objects.create(
        vendor=vendor,
        amount=pending_amount / (1 - commission_rate),
        commission=pending_amount * commission_rate / (1 - commission_rate),
        net_amount=pending_amount,
        status='pending',
        period_start=date.today(),
        period_end=date.today()
    )
    
    AuditLog.objects.create(
        user=request.user.username,
        action='create',
        resource='Payout',
        resource_id=str(payout.id),
        old_values={},
        new_values={'net_amount': str(pending_amount), 'status': 'pending'},
    )
    
    return Response(PayoutSerializer(payout).data, status=status.HTTP_201_CREATED)


class VendorOfferViewSet(viewsets.ModelViewSet):
    queryset = VendorOffer.objects.all()
    serializer_class = VendorOfferSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = VendorOffer.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        return queryset

    def perform_create(self, serializer):
        try:
            vendor = Vendor.objects.get(user=self.request.user)
        except Vendor.DoesNotExist:
            raise ValidationError("Vendor profile not found")
        serializer.save(vendor=vendor)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        offer = self.get_object()
        old_active = offer.active
        offer.active = True
        offer.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='VendorOffer',
            resource_id=str(offer.id),
            old_values={'active': old_active},
            new_values={'active': True},
        )
        
        return Response({'active': True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        offer = self.get_object()
        old_active = offer.active
        offer.active = False
        offer.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='VendorOffer',
            resource_id=str(offer.id),
            old_values={'active': old_active},
            new_values={'active': False},
        )
        
        return Response({'active': False})


class CoachViewSet(viewsets.ModelViewSet):
    queryset = Coach.objects.all()
    serializer_class = CoachSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Coach.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        venue_id = self.request.query_params.get('venue')
        status_filter = self.request.query_params.get('status')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)
        if status_filter:
            queryset = queryset.filter(verification_status=status_filter)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CoachCreateSerializer
        return CoachSerializer

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        coach = self.get_object()
        old_status = coach.verification_status
        coach.verification_status = 'VERIFIED'
        coach.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Coach',
            resource_id=str(coach.id),
            old_values={'verification_status': old_status},
            new_values={'verification_status': 'VERIFIED'},
        )
        
        return Response({'verification_status': 'VERIFIED'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        coach = self.get_object()
        old_status = coach.verification_status
        coach.verification_status = 'REJECTED'
        coach.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Coach',
            resource_id=str(coach.id),
            old_values={'verification_status': old_status},
            new_values={'verification_status': 'REJECTED'},
        )
        
        return Response({'verification_status': 'REJECTED'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        coach = self.get_object()
        coach.is_active = True
        coach.save()
        return Response({'is_active': True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        coach = self.get_object()
        coach.is_active = False
        coach.save()
        return Response({'is_active': False})


class CoachAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = CoachAvailability.objects.all()
    serializer_class = CoachAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CoachAvailability.objects.all()
        coach_id = self.request.query_params.get('coach')
        if coach_id:
            queryset = queryset.filter(coach_id=coach_id)
        return queryset


class CoachPackageViewSet(viewsets.ModelViewSet):
    queryset = CoachPackage.objects.all()
    serializer_class = CoachPackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CoachPackage.objects.all()
        coach_id = self.request.query_params.get('coach')
        if coach_id:
            queryset = queryset.filter(coach_id=coach_id)
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        package = self.get_object()
        package.is_active = True
        package.save()
        return Response({'is_active': True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        package = self.get_object()
        package.is_active = False
        package.save()
        return Response({'is_active': False})


class CoachingSessionViewSet(viewsets.ModelViewSet):
    queryset = CoachingSession.objects.all()
    serializer_class = CoachingSessionSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CoachingSession.objects.all()
        coach_id = self.request.query_params.get('coach')
        vendor_id = self.request.query_params.get('vendor')
        status_filter = self.request.query_params.get('status')
        date_filter = self.request.query_params.get('date')
        if coach_id:
            queryset = queryset.filter(coach_id=coach_id)
        if vendor_id:
            queryset = queryset.filter(coach__vendor_id=vendor_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_filter:
            queryset = queryset.filter(date=date_filter)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CoachingSessionCreateSerializer
        return CoachingSessionSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        session = self.get_object()
        old_status = session.status
        session.status = 'CONFIRMED'
        session.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CoachingSession',
            resource_id=str(session.id),
            old_values={'status': old_status},
            new_values={'status': 'CONFIRMED'},
        )
        
        return Response(CoachingSessionSerializer(session).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        old_status = session.status
        session.status = 'COMPLETED'
        session.attendance_status = 'ATTENDED'
        session.save()
        
        session.coach.total_sessions += 1
        session.coach.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CoachingSession',
            resource_id=str(session.id),
            old_values={'status': old_status},
            new_values={'status': 'COMPLETED'},
        )
        
        return Response(CoachingSessionSerializer(session).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        session = self.get_object()
        old_status = session.status
        session.status = 'CANCELLED'
        session.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CoachingSession',
            resource_id=str(session.id),
            old_values={'status': old_status},
            new_values={'status': 'CANCELLED'},
        )
        
        return Response(CoachingSessionSerializer(session).data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        category = self.request.query_params.get('category')
        is_active = self.request.query_params.get('is_active')
        stock_status = self.request.query_params.get('stock_status')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        if category:
            queryset = queryset.filter(category=category)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if stock_status == 'low':
            queryset = [p for p in queryset if p.is_low_stock]
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        product = self.get_object()
        product.is_active = True
        product.save()
        return Response({'is_active': True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response({'is_active': False})

    @action(detail=True, methods=['post'], url_path='update-stock')
    def update_stock(self, request, pk=None):
        product = self.get_object()
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_quantity = product.stock_quantity
        product.stock_quantity = int(quantity)
        product.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Product',
            resource_id=str(product.id),
            old_values={'stock_quantity': old_quantity},
            new_values={'stock_quantity': product.stock_quantity},
        )
        
        return Response({'stock_quantity': product.stock_quantity})


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProductVariant.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        status_filter = self.request.query_params.get('status')
        payment_status = self.request.query_params.get('payment_status')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderCreateSerializer
        return OrderSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        old_status = order.status
        order.status = 'CONFIRMED'
        order.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Order',
            resource_id=str(order.id),
            old_values={'status': old_status},
            new_values={'status': 'CONFIRMED'},
        )
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        order = self.get_object()
        tracking_number = request.data.get('tracking_number', '')
        courier_name = request.data.get('courier_name', '')
        
        old_status = order.status
        order.status = 'SHIPPED'
        order.tracking_number = tracking_number
        order.courier_name = courier_name
        order.shipped_at = datetime.now()
        order.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Order',
            resource_id=str(order.id),
            old_values={'status': old_status},
            new_values={'status': 'SHIPPED', 'tracking_number': tracking_number},
        )
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        order = self.get_object()
        old_status = order.status
        order.status = 'DELIVERED'
        order.delivered_at = datetime.now()
        order.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Order',
            resource_id=str(order.id),
            old_values={'status': old_status},
            new_values={'status': 'DELIVERED'},
        )
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        old_status = order.status
        order.status = 'CANCELLED'
        order.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='Order',
            resource_id=str(order.id),
            old_values={'status': old_status},
            new_values={'status': 'CANCELLED'},
        )
        
        return Response(OrderSerializer(order).data)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OrderItem.objects.all()
        order_id = self.request.query_params.get('order')
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        return queryset


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Membership.objects.all()
        vendor_id = self.request.query_params.get('vendor')
        membership_type = self.request.query_params.get('type')
        is_active = self.request.query_params.get('is_active')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        if membership_type:
            queryset = queryset.filter(membership_type=membership_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MembershipCreateSerializer
        return MembershipSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        membership = self.get_object()
        membership.is_active = True
        membership.save()
        return Response({'is_active': True})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        membership = self.get_object()
        membership.is_active = False
        membership.save()
        return Response({'is_active': False})


class CustomerMembershipViewSet(viewsets.ModelViewSet):
    queryset = CustomerMembership.objects.all()
    serializer_class = CustomerMembershipSerializer
    pagination_class = AuditLogPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CustomerMembership.objects.all()
        customer_id = self.request.query_params.get('customer')
        membership_id = self.request.query_params.get('membership')
        vendor_id = self.request.query_params.get('vendor')
        status_filter = self.request.query_params.get('status')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        if vendor_id:
            queryset = queryset.filter(membership__vendor_id=vendor_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerMembershipCreateSerializer
        return CustomerMembershipSerializer

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        cm = self.get_object()
        old_status = cm.status
        cm.status = 'PAUSED'
        cm.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CustomerMembership',
            resource_id=str(cm.id),
            old_values={'status': old_status},
            new_values={'status': 'PAUSED'},
        )
        
        return Response(CustomerMembershipSerializer(cm).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        cm = self.get_object()
        old_status = cm.status
        cm.status = 'ACTIVE'
        cm.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CustomerMembership',
            resource_id=str(cm.id),
            old_values={'status': old_status},
            new_values={'status': 'ACTIVE'},
        )
        
        return Response(CustomerMembershipSerializer(cm).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        cm = self.get_object()
        old_status = cm.status
        cm.status = 'CANCELLED'
        cm.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CustomerMembership',
            resource_id=str(cm.id),
            old_values={'status': old_status},
            new_values={'status': 'CANCELLED'},
        )
        
        return Response(CustomerMembershipSerializer(cm).data)

    @action(detail=True, methods=['post'], url_path='use-session')
    def use_session(self, request, pk=None):
        cm = self.get_object()
        if cm.sessions_remaining <= 0:
            return Response({'error': 'No sessions remaining'}, status=status.HTTP_400_BAD_REQUEST)
        
        cm.sessions_used += 1
        cm.sessions_remaining -= 1
        cm.save()
        
        return Response({
            'sessions_used': cm.sessions_used,
            'sessions_remaining': cm.sessions_remaining
        })

    @action(detail=True, methods=['post'], url_path='use-credit')
    def use_credit(self, request, pk=None):
        cm = self.get_object()
        amount = int(request.data.get('amount', 1))
        
        if cm.credits_remaining < amount:
            return Response({'error': 'Insufficient credits'}, status=status.HTTP_400_BAD_REQUEST)
        
        cm.credits_used += amount
        cm.credits_remaining -= amount
        cm.save()
        
        return Response({
            'credits_used': cm.credits_used,
            'credits_remaining': cm.credits_remaining
        })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_refresh(request):
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.exceptions import TokenError
    
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        new_access = str(refresh.access_token)
        return Response({'access': new_access})
    except TokenError as e:
        return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_auth_me(request):
    user = request.user
    
    admin_profile = None
    permissions = {
        'can_manage_vendors': True,
        'can_manage_commissions': True,
        'can_manage_offers': True,
        'can_manage_bookings': True,
        'can_manage_tickets': True,
        'can_manage_reports': True,
        'can_manage_memberships': True,
        'can_manage_payouts': True,
    }
    
    if hasattr(user, 'admin_profile'):
        admin_profile = user.admin_profile
        permissions = {
            'can_manage_vendors': admin_profile.can_onboard_vendor,
            'can_manage_commissions': True,
            'can_manage_offers': True,
            'can_manage_bookings': admin_profile.can_manage_bookings,
            'can_manage_tickets': True,
            'can_manage_reports': admin_profile.can_view_reports,
            'can_manage_memberships': True,
            'can_manage_payouts': True,
        }
    
    role = 'ADMIN'
    if user.is_superuser:
        role = 'SUPER_ADMIN'
    
    return Response({
        'id': user.id,
        'email': user.email,
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'username': user.username,
        'role': role,
        'is_superuser': user.is_superuser,
        **permissions,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_summary(request):
    from django.utils import timezone
    today = timezone.now().date()
    
    total_vendors = Vendor.objects.count()
    active_vendors = Vendor.objects.filter(status='APPROVED').count()
    pending_vendor_approvals = Vendor.objects.filter(status='PENDING').count()
    pending_kyc = VendorKYC.objects.filter(status='PENDING').count()
    open_tickets = Ticket.objects.filter(status__in=['OPEN', 'IN_PROGRESS']).count()
    
    today_bookings = Booking.objects.filter(created_at__date=today).count()
    today_revenue = Booking.objects.filter(created_at__date=today).aggregate(
        total=Sum('amount'))['total'] or 0
    today_ecom_orders = Order.objects.filter(created_at__date=today).count()
    today_membership_sales = CustomerMembership.objects.filter(start_date=today).count()
    
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    bookings_trend = []
    revenue_trend = []
    for day in last_7_days:
        day_bookings = Booking.objects.filter(created_at__date=day).count()
        day_revenue = Booking.objects.filter(created_at__date=day).aggregate(
            total=Sum('amount'))['total'] or 0
        bookings_trend.append({'label': day.strftime('%a'), 'value': day_bookings})
        revenue_trend.append({'label': day.strftime('%a'), 'value': float(day_revenue)})
    
    recent_vendors = Vendor.objects.order_by('-created_at')[:10].values(
        'id', 'business_name', 'vendor_type', 'status')
    
    recent_tickets = Ticket.objects.order_by('-created_at')[:10].values(
        'id', 'subject', 'severity', 'status')
    
    recent_bookings = Booking.objects.select_related(
        'court', 'court__venue', 'court__venue__vendor'
    ).order_by('-created_at')[:10]
    
    recent_bookings_data = []
    for b in recent_bookings:
        recent_bookings_data.append({
            'id': b.id,
            'venue': b.court.venue.name if b.court and b.court.venue else 'N/A',
            'court': b.court.name if b.court else 'N/A',
            'vendor': b.court.venue.vendor.business_name if b.court and b.court.venue and b.court.venue.vendor else 'N/A',
            'status': b.status,
        })
    
    return Response({
        'kpis': {
            'total_vendors': total_vendors,
            'active_vendors': active_vendors,
            'pending_vendor_approvals': pending_vendor_approvals,
            'pending_kyc': pending_kyc,
            'open_tickets': open_tickets,
            'today_bookings': today_bookings,
            'today_revenue': float(today_revenue),
            'today_ecom_orders': today_ecom_orders,
            'today_membership_sales': today_membership_sales,
        },
        'charts': {
            'bookings_last_7_days': bookings_trend,
            'revenue_last_7_days': revenue_trend,
        },
        'recent_vendors': [
            {'id': v['id'], 'business_name': v['business_name'], 
             'roles': [v['vendor_type']] if v['vendor_type'] else [], 'status': v['status']}
            for v in recent_vendors
        ],
        'recent_tickets': list(recent_tickets),
        'recent_bookings': recent_bookings_data,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_commission_config(request):
    config, created = GlobalConfig.objects.get_or_create(
        pk=1,
        defaults={
            'commission_percentage': 10,
            'payout_cycle': 'WEEKLY',
        }
    )
    
    if request.method == 'GET':
        return Response({
            'court_pct': float(config.commission_percentage),
            'coach_pct': float(config.commission_percentage),
            'ecommerce_pct': float(config.commission_percentage),
            'membership_pct': float(config.commission_percentage),
            'effective_from': config.updated_at if hasattr(config, 'updated_at') else None,
        })
    
    elif request.method == 'PATCH':
        data = request.data
        if 'court_pct' in data:
            config.commission_percentage = data['court_pct']
        config.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='CommissionConfig',
            resource_id='1',
            new_values=data,
        )
        
        return Response({
            'court_pct': float(config.commission_percentage),
            'coach_pct': float(config.commission_percentage),
            'ecommerce_pct': float(config.commission_percentage),
            'membership_pct': float(config.commission_percentage),
        })


def is_superadmin(user):
    return hasattr(user, 'superadmin_profile') and user.superadmin_profile.is_active


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def super_auth_login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
        user = authenticate(username=user.username, password=password)
    except User.DoesNotExist:
        user = authenticate(username=email, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(user, 'superadmin_profile'):
        return Response({'error': 'Not a Super Admin account'}, status=status.HTTP_403_FORBIDDEN)
    
    if not user.superadmin_profile.is_active:
        return Response({'error': 'Super Admin account is disabled'}, status=status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)
    
    AuditLog.objects.create(
        user=user.username,
        action='login',
        resource='SuperAuth',
        details={'email': email, 'role': 'SUPER_ADMIN'}
    )

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'role': 'SUPER_ADMIN',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.superadmin_profile.full_name,
        },
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def super_auth_refresh(request):
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.exceptions import TokenError
    
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        new_access = str(refresh.access_token)
        return Response({'access': new_access})
    except TokenError as e:
        return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_auth_me(request):
    user = request.user
    
    if not hasattr(user, 'superadmin_profile'):
        return Response({'error': 'Not a Super Admin'}, status=status.HTTP_403_FORBIDDEN)
    
    profile = user.superadmin_profile
    return Response({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'full_name': profile.full_name,
        'phone': profile.phone,
        'is_active': profile.is_active,
        'role': 'SUPER_ADMIN',
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def super_admins(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        admins = AdminUser.objects.select_related('user').all()
        serializer = AdminUserFullSerializer(admins, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AdminUserCreateBySuper(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        name_parts = data['full_name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data['password'],
            first_name=first_name,
            last_name=last_name,
        )
        
        admin_user = AdminUser.objects.create(
            user=user,
            can_manage_vendors=data.get('can_manage_vendors', True),
            can_manage_bookings=data.get('can_manage_bookings', True),
            can_manage_commissions=data.get('can_manage_commissions', False),
            can_manage_offers=data.get('can_manage_offers', True),
            can_manage_tickets=data.get('can_manage_tickets', True),
            can_manage_reports=data.get('can_manage_reports', False),
            can_view_reports=data.get('can_view_reports', True),
            can_manage_memberships=data.get('can_manage_memberships', True),
            can_manage_payouts=data.get('can_manage_payouts', False),
        )
        
        AuditLog.objects.create(
            user=request.user.username,
            action='create',
            resource='AdminUser',
            resource_id=str(admin_user.id),
            new_values={'email': data['email'], 'full_name': data['full_name']},
        )
        
        return Response(AdminUserFullSerializer(admin_user).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def super_admin_detail(request, admin_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        admin_user = AdminUser.objects.select_related('user').get(pk=admin_id)
    except AdminUser.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        return Response(AdminUserFullSerializer(admin_user).data)
    
    elif request.method == 'PATCH':
        serializer = AdminPermissionsUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        old_values = AdminUserFullSerializer(admin_user).data
        
        for field, value in serializer.validated_data.items():
            setattr(admin_user, field, value)
        admin_user.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='AdminUser',
            resource_id=str(admin_id),
            old_values=old_values,
            new_values=serializer.validated_data,
        )
        
        return Response(AdminUserFullSerializer(admin_user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_admin_enable(request, admin_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        admin_user = AdminUser.objects.get(pk=admin_id)
    except AdminUser.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
    
    admin_user.is_suspended = False
    admin_user.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='AdminUser',
        resource_id=str(admin_id),
        new_values={'is_suspended': False},
        details={'action': 'enable'},
    )
    
    return Response({'status': 'enabled'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_admin_disable(request, admin_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        admin_user = AdminUser.objects.get(pk=admin_id)
    except AdminUser.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
    
    admin_user.is_suspended = True
    admin_user.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='AdminUser',
        resource_id=str(admin_id),
        new_values={'is_suspended': True},
        details={'action': 'disable'},
    )
    
    return Response({'status': 'disabled'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def super_system_config(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    config = SystemConfig.get_config()
    
    if request.method == 'GET':
        return Response(SystemConfigSerializer(config).data)
    
    elif request.method == 'PATCH':
        old_data = SystemConfigSerializer(config).data
        serializer = SystemConfigSerializer(config, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save()
        
        AuditLog.objects.create(
            user=request.user.username,
            action='update',
            resource='SystemConfig',
            resource_id='1',
            old_values=old_data,
            new_values=request.data,
        )
        
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_commissions_history(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    history = CommissionHistory.objects.select_related('changed_by').all()[:50]
    return Response(CommissionHistorySerializer(history, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_commissions_override(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = CommissionOverrideSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    config = SystemConfig.get_config()
    config.default_commission_court = data['court_pct']
    config.default_commission_coach = data['coach_pct']
    config.default_commission_ecommerce = data['ecommerce_pct']
    config.default_commission_membership = data['membership_pct']
    config.save()
    
    history = CommissionHistory.objects.create(
        changed_by=request.user,
        court_pct=data['court_pct'],
        coach_pct=data['coach_pct'],
        ecommerce_pct=data['ecommerce_pct'],
        membership_pct=data['membership_pct'],
        reason=data.get('reason', ''),
    )
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='CommissionOverride',
        resource_id=str(history.id),
        new_values=data,
        details={'warning': 'Platform-wide commission override'},
    )
    
    return Response({
        'message': 'Commissions updated successfully',
        'court_pct': float(config.default_commission_court),
        'coach_pct': float(config.default_commission_coach),
        'ecommerce_pct': float(config.default_commission_ecommerce),
        'membership_pct': float(config.default_commission_membership),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_analytics_summary(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    today = date.today()
    from_date_str = request.query_params.get('from')
    to_date_str = request.query_params.get('to')
    
    try:
        if from_date_str:
            from_date = datetime.strptime(from_date_str, '%Y-%m-%d').date()
        else:
            from_date = today - timedelta(days=30)
        if to_date_str:
            to_date = datetime.strptime(to_date_str, '%Y-%m-%d').date()
        else:
            to_date = today
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    
    total_vendors = Vendor.objects.count()
    total_admins = AdminUser.objects.count()
    active_vendors = Vendor.objects.filter(status='APPROVED').count()
    
    bookings_in_range = Booking.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
    daily_revenue = bookings_in_range.aggregate(total=Sum('amount'))['total'] or 0
    
    config = SystemConfig.get_config()
    commission_rate = float(config.default_commission_court) / 100
    platform_commission = float(daily_revenue) * commission_rate
    
    payouts_paid = Payout.objects.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or 0
    payouts_pending = Payout.objects.filter(status='PENDING').aggregate(total=Sum('amount'))['total'] or 0
    
    top_vendors = Vendor.objects.filter(status='APPROVED').annotate(
        total_bookings=Count('user__venues__courts__bookings')
    ).order_by('-total_bookings')[:10].values('id', 'business_name', 'total_bookings')
    
    vendor_by_type = Vendor.objects.values('vendor_type').annotate(count=Count('id'))
    vendor_by_status = Vendor.objects.values('status').annotate(count=Count('id'))
    
    days_count = (to_date - from_date).days + 1
    revenue_trend = []
    booking_trend = []
    for i in range(min(days_count, 30)):
        day = from_date + timedelta(days=i)
        day_bookings = Booking.objects.filter(created_at__date=day).count()
        day_revenue = Booking.objects.filter(created_at__date=day).aggregate(total=Sum('amount'))['total'] or 0
        revenue_trend.append({'date': day.isoformat(), 'value': float(day_revenue)})
        booking_trend.append({'date': day.isoformat(), 'value': day_bookings})
    
    return Response({
        'summary': {
            'total_vendors': total_vendors,
            'total_admins': total_admins,
            'active_vendors': active_vendors,
            'daily_revenue': float(daily_revenue),
            'platform_commission_collected': platform_commission,
            'payouts_paid': float(payouts_paid),
            'payouts_pending': float(payouts_pending),
        },
        'top_vendors': list(top_vendors),
        'vendor_distribution': {
            'by_type': list(vendor_by_type),
            'by_status': list(vendor_by_status),
        },
        'trends': {
            'revenue': revenue_trend,
            'bookings': booking_trend,
        },
        'date_range': {
            'from': from_date.isoformat(),
            'to': to_date.isoformat(),
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def super_broadcast(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        target = request.query_params.get('target')
        broadcasts = BroadcastMessage.objects.all()
        if target:
            broadcasts = broadcasts.filter(target=target)
        return Response(BroadcastMessageSerializer(broadcasts[:50], many=True).data)
    
    elif request.method == 'POST':
        serializer = BroadcastCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        broadcast = serializer.save(created_by=request.user)
        
        AuditLog.objects.create(
            user=request.user.username,
            action='create',
            resource='BroadcastMessage',
            resource_id=str(broadcast.id),
            new_values={'title': broadcast.title, 'target': broadcast.target},
        )
        
        return Response(BroadcastMessageSerializer(broadcast).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_offer_override(request, offer_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    old_data = OfferSerializer(offer).data
    
    for field in ['value', 'max_discount_amount', 'visibility_percentage', 'max_usage_count']:
        if field in request.data:
            setattr(offer, field, request.data[field])
    
    offer.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='Offer',
        resource_id=str(offer_id),
        old_values=old_data,
        new_values=request.data,
        details={'override_by': 'SUPER_ADMIN'},
    )
    
    return Response(OfferSerializer(offer).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_offer_deactivate(request, offer_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    old_status = offer.status
    offer.status = 'DISABLED'
    offer.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='Offer',
        resource_id=str(offer_id),
        old_values={'status': old_status},
        new_values={'status': 'DISABLED'},
        details={'deactivated_by': 'SUPER_ADMIN'},
    )
    
    return Response({'status': 'DISABLED'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def super_offer_delete(request, offer_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    offer_data = OfferSerializer(offer).data
    offer.delete()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='delete',
        resource='Offer',
        resource_id=str(offer_id),
        old_values=offer_data,
        details={'deleted_by': 'SUPER_ADMIN'},
    )
    
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_vendor_force_deactivate(request, vendor_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        vendor = Vendor.objects.get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    old_status = vendor.status
    vendor.status = 'SUSPENDED'
    vendor.suspension_reason = request.data.get('reason', 'Deactivated by Super Admin')
    vendor.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='Vendor',
        resource_id=str(vendor_id),
        old_values={'status': old_status},
        new_values={'status': 'SUSPENDED'},
        details={'force_deactivated_by': 'SUPER_ADMIN', 'reason': vendor.suspension_reason},
    )
    
    return Response({'status': 'SUSPENDED'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_vendor_force_reset(request, vendor_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        vendor = Vendor.objects.get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    old_data = {
        'status': vendor.status,
        'kyc_status': vendor.kyc_status,
        'kyc_verified': vendor.kyc_verified,
    }
    
    vendor.status = 'PENDING'
    vendor.kyc_status = 'NOT_SUBMITTED'
    vendor.kyc_verified = False
    vendor.rejection_reason = ''
    vendor.suspension_reason = ''
    vendor.save()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='update',
        resource='Vendor',
        resource_id=str(vendor_id),
        old_values=old_data,
        new_values={'status': 'PENDING', 'kyc_status': 'NOT_SUBMITTED'},
        details={'force_reset_by': 'SUPER_ADMIN'},
    )
    
    return Response({'status': 'PENDING', 'message': 'Vendor reset to pending status'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def super_vendor_hard_delete(request, vendor_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        vendor = Vendor.objects.get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    vendor_data = VendorSerializer(vendor).data
    vendor.delete()
    
    AuditLog.objects.create(
        user=request.user.username,
        action='delete',
        resource='Vendor',
        resource_id=str(vendor_id),
        old_values=vendor_data,
        details={'hard_deleted_by': 'SUPER_ADMIN'},
    )
    
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_audit_logs(request):
    if not is_superadmin(request.user):
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    logs = AuditLog.objects.all()
    
    actor_type = request.query_params.get('actor_type')
    if actor_type:
        if actor_type == 'SUPERADMIN':
            super_usernames = SuperAdmin.objects.values_list('user__username', flat=True)
            logs = logs.filter(user__in=super_usernames)
        elif actor_type == 'ADMIN':
            admin_usernames = AdminUser.objects.values_list('user__username', flat=True)
            logs = logs.filter(user__in=admin_usernames)
        elif actor_type == 'VENDOR':
            vendor_usernames = Vendor.objects.filter(user__isnull=False).values_list('user__username', flat=True)
            logs = logs.filter(user__in=vendor_usernames)
    
    entity_type = request.query_params.get('entity_type')
    if entity_type:
        logs = logs.filter(resource=entity_type)
    
    date_filter = request.query_params.get('date')
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            logs = logs.filter(created_at__date=filter_date)
        except ValueError:
            pass
    
    paginator = AuditLogPagination()
    page = paginator.paginate_queryset(logs, request)
    serializer = AuditLogDetailSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)
