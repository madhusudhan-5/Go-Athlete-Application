from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from coaches.models import Coach, CoachAvailability, CoachPackage
from bookings.models import CoachingSession
from core.models import VendorProfile


class CoachViewSet(viewsets.ModelViewSet):
    """
    Coach Management API
    GET/POST /api/v1/vendor/coaches/ - List/Create coaches
    GET/PUT/DELETE /api/v1/vendor/coaches/{id}/ - Coach detail/update/delete
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter coaches by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            return Coach.objects.filter(vendor=vendor).select_related('user', 'verified_by')
        return Coach.objects.none()

    def perform_create(self, serializer):
        """Create coach for current vendor"""
        user = self.request.user
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        serializer.save(vendor=user.vendor_profile)

    def get_serializer_class(self):
        """Return appropriate serializer"""
        # TODO: Create CoachSerializer
        from rest_framework import serializers
        from coaches.models import Coach
        
        class CoachSerializer(serializers.ModelSerializer):
            class Meta:
                model = Coach
                fields = [
                    'id', 'user', 'first_name', 'last_name', 'bio', 'profile_image',
                    'specializations', 'years_of_experience', 'certifications',
                    'hourly_rate', 'is_verified', 'verification_status',
                    'available_for_online', 'available_for_venue', 'available_for_home',
                    'max_home_travel_km', 'home_visit_extra_charge',
                    'max_clients_per_session', 'cancellation_policy',
                    'avg_rating', 'total_ratings', 'total_sessions', 'is_active'
                ]
                read_only_fields = ['id', 'is_verified', 'verification_status', 'avg_rating', 'total_ratings', 'total_sessions']
        
        return CoachSerializer


class CoachAvailabilityViewSet(viewsets.ModelViewSet):
    """
    Coach Availability API
    GET/POST /api/v1/vendor/coaches/{coach_id}/availability/ - List/Create availability
    GET/PUT/DELETE /api/v1/vendor/coaches/{coach_id}/availability/{id}/ - Availability detail/update/delete
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter availability by coach and vendor"""
        user = self.request.user
        coach_id = self.kwargs.get('coach_id')
        
        if hasattr(user, 'vendor_profile') and coach_id:
            try:
                coach = Coach.objects.get(id=coach_id, vendor=user.vendor_profile)
                return CoachAvailability.objects.filter(coach=coach)
            except Coach.DoesNotExist:
                return CoachAvailability.objects.none()
        return CoachAvailability.objects.none()

    def perform_create(self, serializer):
        """Create availability for coach"""
        user = self.request.user
        coach_id = self.kwargs.get('coach_id')
        
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        
        try:
            coach = Coach.objects.get(id=coach_id, vendor=user.vendor_profile)
            serializer.save(coach=coach)
        except Coach.DoesNotExist:
            raise PermissionError('Coach not found or access denied')


class CoachPackageViewSet(viewsets.ModelViewSet):
    """
    Coach Package API
    GET/POST /api/v1/vendor/coaches/{coach_id}/packages/ - List/Create packages
    GET/PUT/DELETE /api/v1/vendor/coaches/{coach_id}/packages/{id}/ - Package detail/update/delete
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter packages by coach and vendor"""
        user = self.request.user
        coach_id = self.kwargs.get('coach_id')
        
        if hasattr(user, 'vendor_profile') and coach_id:
            try:
                coach = Coach.objects.get(id=coach_id, vendor=user.vendor_profile)
                return CoachPackage.objects.filter(coach=coach)
            except Coach.DoesNotExist:
                return CoachPackage.objects.none()
        return CoachPackage.objects.none()

    def perform_create(self, serializer):
        """Create package for coach"""
        user = self.request.user
        coach_id = self.kwargs.get('coach_id')
        
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        
        try:
            coach = Coach.objects.get(id=coach_id, vendor=user.vendor_profile)
            serializer.save(coach=coach)
        except Coach.DoesNotExist:
            raise PermissionError('Coach not found or access denied')


class CoachingSessionViewSet(viewsets.ModelViewSet):
    """
    Coaching Session API
    GET/POST /api/v1/vendor/coaching-sessions/ - List/Create sessions
    GET/PUT/DELETE /api/v1/vendor/coaching-sessions/{id}/ - Session detail/update/delete
    POST /api/v1/vendor/coaching-sessions/{id}/complete/ - Mark session as completed
    POST /api/v1/vendor/coaching-sessions/{id}/cancel/ - Cancel session
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter sessions by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            return CoachingSession.objects.filter(
                coach__vendor=vendor
            ).select_related('coach', 'customer_user', 'applied_offer')
        return CoachingSession.objects.none()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark session as completed"""
        session = self.get_object()
        attendance_status = request.data.get('attendance_status', 'COMPLETED')
        feedback_rating = request.data.get('feedback_rating')
        feedback_comment = request.data.get('feedback_comment')
        
        session.attendance_status = attendance_status
        if feedback_rating:
            session.feedback_rating = feedback_rating
        if feedback_comment:
            session.feedback_comment = feedback_comment
        
        session.save()
        
        return Response({
            'id': str(session.id),
            'attendance_status': session.attendance_status,
            'message': 'Session marked as completed'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel coaching session"""
        session = self.get_object()
        reason = request.data.get('reason', '')
        
        session.attendance_status = 'CANCELLED'
        session.save()
        
        # TODO: Handle refund logic
        
        return Response({
            'id': str(session.id),
            'attendance_status': session.attendance_status,
            'message': 'Session cancelled'
        }, status=status.HTTP_200_OK)

