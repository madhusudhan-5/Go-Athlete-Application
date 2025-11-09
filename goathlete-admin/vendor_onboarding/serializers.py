from rest_framework import serializers
from .models import (
    OnboardingStatus, LegalDetails, KYCDocument, BankDetails,
    SportsFacility, Court, CoachProfile, CoachAvailability,
    EcommerceStore, Product, ProductImage
)

class OnboardingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingStatus
        fields = '__all__'
        read_only_fields = ('completion_percentage', 'is_submitted', 'submitted_at')


class LegalDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDetails
        exclude = ('vendor',)


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        exclude = ('vendor', 'is_verified', 'verification_notes', 'verified_at', 'verified_by')


class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetails
        exclude = ('vendor', 'is_verified')


class CourtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Court
        exclude = ('facility',)


class SportsFacilitySerializer(serializers.ModelSerializer):
    courts = CourtSerializer(many=True, required=False)

    class Meta:
        model = SportsFacility
        exclude = ('vendor',)

    def create(self, validated_data):
        courts_data = validated_data.pop('courts', [])
        facility = SportsFacility.objects.create(**validated_data)
        
        for court_data in courts_data:
            Court.objects.create(facility=facility, **court_data)
        
        return facility


class CoachAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachAvailability
        exclude = ('coach',)


class CoachProfileSerializer(serializers.ModelSerializer):
    availability = CoachAvailabilitySerializer(many=True, required=False)

    class Meta:
        model = CoachProfile
        exclude = ('vendor',)

    def create(self, validated_data):
        availability_data = validated_data.pop('availability', [])
        coach_profile = CoachProfile.objects.create(**validated_data)
        
        for availability in availability_data:
            CoachAvailability.objects.create(coach=coach_profile, **availability)
        
        return coach_profile


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        exclude = ('product',)


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        exclude = ('store',)

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        product = Product.objects.create(**validated_data)
        
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)
        
        return product


class EcommerceStoreSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, required=False)

    class Meta:
        model = EcommerceStore
        exclude = ('vendor',)

    def create(self, validated_data):
        products_data = validated_data.pop('products', [])
        store = EcommerceStore.objects.create(**validated_data)
        
        for product_data in products_data:
            images_data = product_data.pop('images', [])
            product = Product.objects.create(store=store, **product_data)
            
            for image_data in images_data:
                ProductImage.objects.create(product=product, **image_data)
        
        return store


class OnboardingProgressSerializer(serializers.ModelSerializer):
    legal_details = LegalDetailsSerializer(required=False)
    kyc_documents = KYCDocumentSerializer(many=True, required=False)
    bank_details = BankDetailsSerializer(required=False)
    sports_facility = SportsFacilitySerializer(required=False)
    coach_profile = CoachProfileSerializer(required=False)
    ecommerce_store = EcommerceStoreSerializer(required=False)
    onboarding_status = OnboardingStatusSerializer(required=False)

    class Meta:
        model = OnboardingStatus
        fields = '__all__'