import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { spacing, typography, shape, elevation } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';
import { useToast } from '../components/Toast';
import { fileUploadService } from '../services/fileUpload';

export default function AddProductScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { vendorId } = useVendor();
  const { showSuccess, showError, showWarning } = useToast();
  const editProduct = route.params?.product;
  const isEditMode = !!editProduct;

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    sku: editProduct?.sku || '',
    description: editProduct?.description || '',
    category: editProduct?.category || 'EQUIPMENT',
    price: editProduct?.price?.toString() || '',
    cost_price: editProduct?.cost_price?.toString() || '0',
    discount_percentage: editProduct?.discount_percentage?.toString() || '0',
    stock_quantity: editProduct?.stock_quantity?.toString() || '0',
    min_stock_threshold: editProduct?.min_stock_threshold?.toString() || '5',
    weight_kg: editProduct?.weight_kg?.toString() || '0',
    shipping_class: editProduct?.shipping_class || 'REGULAR',
    tags: editProduct?.tags?.join(', ') || '',
    images: editProduct?.images || [],
  });

  const styles = createStyles(colors);

  const pickPhoto = async () => {
    if (formData.images.length >= 5) {
      showWarning('Maximum 5 photos allowed');
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const result = await fileUploadService.pickImage({ allowsEditing: true, aspect: [1, 1] });
      if (!result.cancelled && result.uri) {
        setFormData({ ...formData, images: [...formData.images, result.uri] });
      }
    } catch (error) {
      showError('Failed to select photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showWarning('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      showWarning('SKU is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showWarning('Valid price is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vendor: vendorId,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price) || 0,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_threshold: parseInt(formData.min_stock_threshold) || 5,
        weight_kg: parseFloat(formData.weight_kg) || 0,
        shipping_class: formData.shipping_class,
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
        images: formData.images,
      };

      if (isEditMode) {
        await vendorService.updateProduct(editProduct.id, payload);
        showSuccess('Product updated successfully!');
      } else {
        await vendorService.createProduct(payload);
        showSuccess('Product created successfully!');
      }

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }, 1000);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save product';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'APPAREL', label: 'Apparel' },
    { value: 'ACCESSORIES', label: 'Accessories' },
    { value: 'NUTRITION', label: 'Nutrition' },
    { value: 'MERCHANDISE', label: 'Merchandise' },
    { value: 'OTHER', label: 'Other' },
  ];

  const shippingClasses = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'EXPRESS', label: 'Express' },
    { value: 'FRAGILE', label: 'Fragile' },
    { value: 'HEAVY', label: 'Heavy' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Photos</Text>
          <Text style={styles.helperText}>Add up to 5 photos of your product</Text>
          
          <View style={styles.photoGrid}>
            {formData.images.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity 
                  style={styles.removePhotoBtn}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {formData.images.length < 5 && (
              <TouchableOpacity 
                style={styles.addPhotoBtn}
                onPress={pickPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.addPhotoIcon}>📷</Text>
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter product name"
            placeholderTextColor={colors.outline}
          />

          <Text style={styles.label}>SKU *</Text>
          <TextInput
            style={styles.input}
            value={formData.sku}
            onChangeText={(text) => setFormData({ ...formData, sku: text })}
            placeholder="PROD-001"
            placeholderTextColor={colors.outline}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Product description"
            placeholderTextColor={colors.outline}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  formData.category === cat.value && styles.chipSelected
                ]}
                onPress={() => setFormData({ ...formData, category: cat.value })}
              >
                <Text style={[
                  styles.chipText,
                  formData.category === cat.value && styles.chipTextSelected
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <Text style={styles.label}>Price (INR) *</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="0.00"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Cost Price (INR)</Text>
          <TextInput
            style={styles.input}
            value={formData.cost_price}
            onChangeText={(text) => setFormData({ ...formData, cost_price: text })}
            placeholder="0.00"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            value={formData.discount_percentage}
            onChangeText={(text) => setFormData({ ...formData, discount_percentage: text })}
            placeholder="0"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>

          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput
            style={styles.input}
            value={formData.stock_quantity}
            onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
            placeholder="0"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Low Stock Threshold</Text>
          <TextInput
            style={styles.input}
            value={formData.min_stock_threshold}
            onChangeText={(text) => setFormData({ ...formData, min_stock_threshold: text })}
            placeholder="5"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping</Text>

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight_kg}
            onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
            placeholder="0.0"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Shipping Class</Text>
          <View style={styles.chipContainer}>
            {shippingClasses.map((sc) => (
              <TouchableOpacity
                key={sc.value}
                style={[
                  styles.chip,
                  formData.shipping_class === sc.value && styles.chipSelected
                ]}
                onPress={() => setFormData({ ...formData, shipping_class: sc.value })}
              >
                <Text style={[
                  styles.chipText,
                  formData.shipping_class === sc.value && styles.chipTextSelected
                ]}>
                  {sc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => setFormData({ ...formData, tags: text })}
            placeholder="sports, cricket, bat"
            placeholderTextColor={colors.outline}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: shape.corner,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...elevation.level1,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: shape.cornerSmall,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: shape.cornerSmall,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtnText: {
    color: colors.onError || '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: shape.cornerSmall,
    borderWidth: 2,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: shape.cornerFull,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...elevation.level2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
  },
});
