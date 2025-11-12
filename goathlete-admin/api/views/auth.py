from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
import random
import string

from accounts.models import User, LoginAttempt, AuditLog
from core.models import VendorProfile


class AuthViewSet(viewsets.ViewSet):
    """
    Authentication API endpoints
    POST /api/v1/auth/register/ - Register new user
    POST /api/v1/auth/verify-otp/ - Verify OTP and get tokens
    POST /api/v1/auth/login/ - Login with email/password
    POST /api/v1/auth/refresh/ - Refresh access token
    POST /api/v1/auth/logout/ - Logout
    GET /api/v1/auth/me/ - Get current user
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new user"""
        email = request.data.get('email', '').lower().strip()
        phone_number = request.data.get('phone_number', '').strip()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'CUSTOMER').upper()

        # Validate required fields
        if not email or not password or not first_name or not last_name:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate role
        valid_roles = ['VENDOR', 'CUSTOMER', 'ADMIN', 'SUPER_ADMIN']
        if role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered', 'field': 'email'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            return Response(
                {'error': 'Phone number already registered', 'field': 'phone_number'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number if phone_number else None,
                    role=role,
                    is_verified=False
                )

                # Generate OTP (mock - in production, send via SMS/Email)
                otp = ''.join(random.choices(string.digits, k=6))
                # TODO: Store OTP in cache/DB and send via SMS/Email service
                # For now, we'll just return success

                # Log audit
                AuditLog.objects.create(
                    user=user,
                    action='CREATE',
                    entity_type='User',
                    entity_id=user.id,
                    new_values={'email': email, 'role': role},
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    status='SUCCESS'
                )

                return Response({
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'message': 'OTP sent to registered phone/email',
                    'otp': otp  # Remove in production
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Verify OTP and return JWT tokens"""
        email = request.data.get('email', '').lower().strip()
        otp = request.data.get('otp', '')

        if not email or not otp:
            return Response(
                {'error': 'Email and OTP are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # TODO: Verify OTP from cache/DB
        # For now, accept any 6-digit OTP
        if len(otp) != 6 or not otp.isdigit():
            return Response(
                {'error': 'Invalid OTP format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark user as verified
        user.is_verified = True
        user.save(update_fields=['is_verified'])

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Log login attempt
        LoginAttempt.objects.create(
            user=user,
            email=email,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True
        )

        # Reset login attempts
        user.reset_login_attempts()

        return Response({
            'access_token': access_token,
            'refresh_token': str(refresh),
            'expires_in': 3600,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_verified': user.is_verified
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login with email and password"""
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get client IP
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Log failed attempt
            LoginAttempt.objects.create(
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                reason_failed='User not found'
            )
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if account is locked
        if user.is_locked():
            LoginAttempt.objects.create(
                user=user,
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                reason_failed='Account locked'
            )
            return Response(
                {'error': 'Account is locked. Please try again later.'},
                status=status.HTTP_423_LOCKED
            )

        # Authenticate user
        user_auth = authenticate(request, username=email, password=password)
        if not user_auth:
            # Increment login attempts
            user.increment_login_attempts()
            LoginAttempt.objects.create(
                user=user,
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                reason_failed='Invalid password'
            )
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Update last login
        user.last_login = timezone.now()
        user.reset_login_attempts()
        user.save(update_fields=['last_login', 'login_attempts', 'locked_until'])

        # Log successful login
        LoginAttempt.objects.create(
            user=user,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )

        AuditLog.objects.create(
            user=user,
            action='LOGIN',
            entity_type='User',
            entity_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            status='SUCCESS'
        )

        # Get vendor profile if vendor
        vendor_profile = None
        if user.role == 'VENDOR' and hasattr(user, 'vendor_profile'):
            vendor_profile = {
                'id': str(user.vendor_profile.id),
                'business_name': user.vendor_profile.business_name,
                'vendor_type': user.vendor_profile.vendor_type,
                'approval_status': user.vendor_profile.approval_status
            }

        return Response({
            'access_token': access_token,
            'refresh_token': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_verified': user.is_verified,
                'vendor_profile': vendor_profile
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user"""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        AuditLog.objects.create(
            user=request.user,
            action='LOGOUT',
            entity_type='User',
            entity_id=request.user.id,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status='SUCCESS'
        )

        return Response({
            'message': 'Logged out successfully',
            'session_ended_at': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        user = request.user
        vendor_profile = None

        if user.role == 'VENDOR' and hasattr(user, 'vendor_profile'):
            vendor_profile = {
                'id': str(user.vendor_profile.id),
                'business_name': user.vendor_profile.business_name,
                'vendor_type': user.vendor_profile.vendor_type,
                'approval_status': user.vendor_profile.approval_status
            }

        return Response({
            'id': str(user.id),
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'avatar_url': user.avatar_url,
            'is_verified': user.is_verified,
            'vendor_profile': vendor_profile
        }, status=status.HTTP_200_OK)

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

