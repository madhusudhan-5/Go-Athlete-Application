from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count

from ecommerce.models import EcommerceVendor, Product, ProductVariant
from bookings.models import Order
from core.models import VendorProfile


class ProductViewSet(viewsets.ModelViewSet):
    """
    Product Management API
    GET/POST /api/v1/vendor/products/ - List/Create products
    GET/PUT/DELETE /api/v1/vendor/products/{id}/ - Product detail/update/delete
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter products by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            return Product.objects.filter(vendor=vendor).prefetch_related('variants')
        return Product.objects.none()

    def perform_create(self, serializer):
        """Create product for current vendor"""
        user = self.request.user
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        
        vendor = user.vendor_profile
        if vendor.vendor_type not in ['ECOMMERCE', 'HYBRID']:
            raise PermissionError('Vendor type does not support ecommerce')
        
        serializer.save(vendor=vendor)

    def get_serializer_class(self):
        """Return appropriate serializer"""
        from rest_framework import serializers
        from ecommerce.models import Product
        
        class ProductSerializer(serializers.ModelSerializer):
            class Meta:
                model = Product
                fields = [
                    'id', 'sku', 'name', 'description', 'category', 'price', 'cost_price',
                    'discount_percentage', 'currency', 'images', 'stock_quantity',
                    'low_stock_threshold', 'weight_kg', 'dimensions_cm', 'shipping_class',
                    'is_returnable', 'return_window_days', 'warranty_description', 'is_active'
                ]
                read_only_fields = ['id']
        
        return ProductSerializer


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    Product Variant API
    GET/POST /api/v1/vendor/products/{product_id}/variants/ - List/Create variants
    GET/PUT/DELETE /api/v1/vendor/products/{product_id}/variants/{id}/ - Variant detail/update/delete
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter variants by product and vendor"""
        user = self.request.user
        product_id = self.kwargs.get('product_id')
        
        if hasattr(user, 'vendor_profile') and product_id:
            try:
                product = Product.objects.get(id=product_id, vendor=user.vendor_profile)
                return ProductVariant.objects.filter(product=product)
            except Product.DoesNotExist:
                return ProductVariant.objects.none()
        return ProductVariant.objects.none()

    def perform_create(self, serializer):
        """Create variant for product"""
        user = self.request.user
        product_id = self.kwargs.get('product_id')
        
        if not hasattr(user, 'vendor_profile'):
            raise PermissionError('User is not associated with a vendor')
        
        try:
            product = Product.objects.get(id=product_id, vendor=user.vendor_profile)
            serializer.save(product=product)
        except Product.DoesNotExist:
            raise PermissionError('Product not found or access denied')


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Order Management API (Read-only for vendors)
    GET /api/v1/vendor/orders/ - List orders
    GET /api/v1/vendor/orders/{id}/ - Order detail
    PUT /api/v1/vendor/orders/{id}/fulfill/ - Update fulfillment status
    PUT /api/v1/vendor/orders/{id}/ship/ - Update shipping details
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter orders by vendor"""
        user = self.request.user
        if hasattr(user, 'vendor_profile'):
            vendor = user.vendor_profile
            return Order.objects.filter(vendor=vendor).select_related('customer_user', 'applied_offer')
        return Order.objects.none()

    @action(detail=True, methods=['put'])
    def fulfill(self, request, pk=None):
        """Update order fulfillment status"""
        order = self.get_object()
        fulfillment_status = request.data.get('fulfillment_status')
        tracking_number = request.data.get('tracking_number')
        tracking_url = request.data.get('tracking_url')
        courier_name = request.data.get('courier_name')
        
        if fulfillment_status:
            order.fulfillment_status = fulfillment_status
            if fulfillment_status == 'SHIPPED':
                order.order_status = 'SHIPPED'
        
        if tracking_number:
            order.tracking_number = tracking_number
        if tracking_url:
            order.tracking_url = tracking_url
        if courier_name:
            order.courier_name = courier_name
        
        order.save()
        
        return Response({
            'id': str(order.id),
            'order_status': order.order_status,
            'fulfillment_status': order.fulfillment_status,
            'message': 'Order fulfillment updated'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'])
    def ship(self, request, pk=None):
        """Update shipping details"""
        order = self.get_object()
        
        order.tracking_number = request.data.get('tracking_number', order.tracking_number)
        order.tracking_url = request.data.get('tracking_url', order.tracking_url)
        order.courier_name = request.data.get('courier_name', order.courier_name)
        order.fulfillment_status = 'SHIPPED'
        order.order_status = 'SHIPPED'
        order.save()
        
        return Response({
            'id': str(order.id),
            'order_status': order.order_status,
            'tracking_number': order.tracking_number,
            'message': 'Shipping details updated'
        }, status=status.HTTP_200_OK)

