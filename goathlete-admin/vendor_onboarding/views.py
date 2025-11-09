from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import (
    OnboardingStatus, LegalDetails, KYCDocument, BankDetails,
    SportsFacility, Court, CoachProfile, CoachAvailability,
    EcommerceStore, Product
)
from .serializers import (
    OnboardingStatusSerializer, LegalDetailsSerializer,
    KYCDocumentSerializer, BankDetailsSerializer,
    SportsFacilitySerializer, CourtSerializer,
    CoachProfileSerializer, CoachAvailabilitySerializer,
    EcommerceStoreSerializer, ProductSerializer,
    OnboardingProgressSerializer
)

class OnboardingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OnboardingProgressSerializer

    def get_queryset(self):
        return OnboardingStatus.objects.filter(vendor__user=self.request.user)

    @action(detail=False, methods=['post'])
    def start_onboarding(self, request):
        """Initialize onboarding process for a new vendor"""
        vendor_type = request.data.get('vendor_type')
        if not vendor_type:
            return Response(
                {'error': 'Vendor type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            onboarding = OnboardingStatus.objects.create(
                vendor=request.user.vendor_profile,
                current_step='BUSINESS_TYPE'
            )
            serializer = self.get_serializer(onboarding)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def submit_legal_details(self, request, pk=None):
        """Submit legal details for the vendor"""
        onboarding = self.get_object()
        serializer = LegalDetailsSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(vendor=onboarding.vendor)
            onboarding.current_step = 'KYC_DOCUMENTS'
            onboarding.completion_percentage = 25
            onboarding.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def upload_kyc(self, request, pk=None):
        """Upload KYC documents"""
        onboarding = self.get_object()
        serializer = KYCDocumentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(vendor=onboarding.vendor)
            onboarding.current_step = 'BUSINESS_DETAILS'
            onboarding.completion_percentage = 50
            onboarding.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def submit_business_details(self, request, pk=None):
        """Submit business-specific details based on vendor type"""
        onboarding = self.get_object()
        vendor_type = onboarding.vendor.vendor_type
        
        if vendor_type == 'VENUE':
            serializer = SportsFacilitySerializer(data=request.data)
        elif vendor_type == 'COACH':
            serializer = CoachProfileSerializer(data=request.data)
        else:  # ECOMMERCE
            serializer = EcommerceStoreSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(vendor=onboarding.vendor)
            onboarding.current_step = 'BANK_DETAILS'
            onboarding.completion_percentage = 75
            onboarding.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def submit_bank_details(self, request, pk=None):
        """Submit bank details"""
        onboarding = self.get_object()
        serializer = BankDetailsSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(vendor=onboarding.vendor)
            onboarding.current_step = 'REVIEW'
            onboarding.completion_percentage = 90
            onboarding.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def final_submit(self, request, pk=None):
        """Submit the complete onboarding application for review"""
        onboarding = self.get_object()
        
        # Validate all required information is present
        if not all([
            hasattr(onboarding.vendor, 'legal_details'),
            onboarding.vendor.kyc_documents.exists(),
            hasattr(onboarding.vendor, 'bank_details'),
        ]):
            return Response(
                {'error': 'All required information must be completed before submission'},
                status=status.HTTP_400_BAD_REQUEST
            )

        onboarding.current_step = 'SUBMITTED'
        onboarding.is_submitted = True
        onboarding.submitted_at = timezone.now()
        onboarding.completion_percentage = 100
        onboarding.save()
        
        serializer = self.get_serializer(onboarding)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get the current progress of onboarding"""
        onboarding = self.get_object()
        serializer = OnboardingProgressSerializer(onboarding)
        return Response(serializer.data)


class VendorTypeViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def business_types(self, request):
        """Get available business types and their requirements"""
        business_types = {
            'VENUE': {
                'name': 'Sports Venue',
                'description': 'For sports facilities, courts, and training centers',
                'required_documents': [
                    'Business License',
                    'Property Documents/Lease Agreement',
                    'Insurance Certificate',
                    'Tax Registration'
                ],
                'features': [
                    'Multiple court management',
                    'Facility scheduling',
                    'Equipment rental tracking',
                    'Membership management'
                ]
            },
            'COACH': {
                'name': 'Sports Coach',
                'description': 'For individual coaches and trainers',
                'required_documents': [
                    'Coaching Certifications',
                    'Identity Proof',
                    'Professional Insurance',
                    'Tax Registration'
                ],
                'features': [
                    'Schedule management',
                    'Student progress tracking',
                    'Online booking',
                    'Performance analytics'
                ]
            },
            'ECOMMERCE': {
                'name': 'Sports Equipment Store',
                'description': 'For sports equipment and merchandise sellers',
                'required_documents': [
                    'Business Registration',
                    'GST Registration',
                    'Shop License',
                    'Bank Account Proof'
                ],
                'features': [
                    'Product management',
                    'Inventory tracking',
                    'Order processing',
                    'Returns handling'
                ]
            }
        }
        return Response(business_types)