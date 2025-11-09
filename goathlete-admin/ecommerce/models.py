import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class EcommerceVendor(models.Model):
    """Ecommerce shop registration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.OneToOneField(
        'core.VendorProfile',
        on_delete=models.CASCADE,
        related_name='ecommerce_shop',
        limit_choices_to={'vendor_type__in': ['ECOMMERCE', 'HYBRID']}
    )
    shop_name = models.CharField(max_length=200)
    shop_description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    banner_url = models.URLField(max_length=500, blank=True, null=True)
    categories = models.JSONField(
        default=list,
        help_text="Array: ['Equipment', 'Apparel', 'Nutrition', ...]"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shop_name} - {self.vendor.business_name}"


class Product(models.Model):
    """Product catalog for ecommerce"""
    CATEGORY_CHOICES = (
        ('EQUIPMENT', 'Equipment'),
        ('APPAREL', 'Apparel'),
        ('FOOTWEAR', 'Footwear'),
        ('ACCESSORIES', 'Accessories'),
        ('NUTRITION', 'Nutrition'),
        ('DIGITAL', 'Digital'),
    )

    SHIPPING_CLASS_CHOICES = (
        ('REGULAR', 'Regular'),
        ('OVERSIZE', 'Oversize'),
        ('FRAGILE', 'Fragile'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        'core.VendorProfile',
        on_delete=models.CASCADE,
        related_name='products',
        limit_choices_to={'vendor_type__in': ['ECOMMERCE', 'HYBRID']}
    )
    sku = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Internal cost price"
    )
    discount_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    currency = models.CharField(max_length=3, default='INR')
    images = models.JSONField(default=list, help_text="Array of image URLs, max 10")
    stock_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    weight_kg = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    dimensions_cm = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON: {length, width, height}"
    )
    shipping_class = models.CharField(max_length=20, choices=SHIPPING_CLASS_CHOICES, default='REGULAR')
    is_returnable = models.BooleanField(default=True)
    return_window_days = models.IntegerField(default=30, validators=[MinValueValidator(0)])
    warranty_description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['vendor', 'sku']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku}) - {self.vendor.business_name}"


class ProductVariant(models.Model):
    """Product variants (size, color, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_name = models.CharField(max_length=200, help_text="e.g., 'Size: L, Color: Blue'")
    sku_variant = models.CharField(max_length=100, db_index=True)
    price_modifier = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Price adjustment (+/-)"
    )
    stock_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'sku_variant']

    def __str__(self):
        return f"{self.product.name} - {self.variant_name}"

