import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function OfferFormScreen({ navigation, route }) {
  const { offer } = route.params || {};
  const isEditing = !!offer;
  const { vendorId } = useVendor();
  
  const [form, setForm] = useState({
    title: offer?.title || '',
    description: offer?.description || '',
    discount_type: offer?.discount_type || 'PERCENT',
    discount_value: offer?.discount_value?.toString() || '',
    valid_from: offer?.valid_from || '',
    valid_to: offer?.valid_to || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!form.discount_value) {
      newErrors.discount_value = 'Discount value is required';
    } else {
      const val = parseFloat(form.discount_value);
      if (isNaN(val) || val <= 0) {
        newErrors.discount_value = 'Must be a positive number';
      } else if (form.discount_type === 'PERCENT' && val > 100) {
        newErrors.discount_value = 'Percentage cannot exceed 100';
      }
    }
    
    if (!form.valid_from) {
      newErrors.valid_from = 'Start date is required';
    }
    
    if (!form.valid_to) {
      newErrors.valid_to = 'End date is required';
    } else if (form.valid_from && new Date(form.valid_to) < new Date(form.valid_from)) {
      newErrors.valid_to = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        vendor: vendorId,
        title: form.title.trim(),
        description: form.description.trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        valid_from: form.valid_from,
        valid_to: form.valid_to,
        active: false,
      };
      
      if (isEditing) {
        await vendorService.updateOffer(offer.id, payload);
      } else {
        await vendorService.createOffer(payload);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save offer:', error);
      Alert.alert('Error', 'Failed to save offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const DiscountTypeButton = ({ type, label }) => (
    <TouchableOpacity
      style={[styles.typeBtn, form.discount_type === type && styles.typeBtnActive]}
      onPress={() => updateField('discount_type', type)}
    >
      <Text style={[styles.typeBtnText, form.discount_type === type && styles.typeBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={form.title}
            onChangeText={(val) => updateField('title', val)}
            placeholder="e.g., Weekend Special"
            placeholderTextColor={colors.onSurfaceVariant}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={(val) => updateField('description', val)}
            placeholder="Optional description"
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Discount Type *</Text>
          <View style={styles.typeButtonsRow}>
            <DiscountTypeButton type="PERCENT" label="Percentage (%)" />
            <DiscountTypeButton type="FLAT" label="Flat Amount (₹)" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Discount Value {form.discount_type === 'PERCENT' ? '(%)' : '(₹)'} *
          </Text>
          <TextInput
            style={[styles.input, errors.discount_value && styles.inputError]}
            value={form.discount_value}
            onChangeText={(val) => updateField('discount_value', val)}
            placeholder={form.discount_type === 'PERCENT' ? 'e.g., 10' : 'e.g., 100'}
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="numeric"
          />
          {errors.discount_value && <Text style={styles.errorText}>{errors.discount_value}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Valid From *</Text>
            <TextInput
              style={[styles.input, errors.valid_from && styles.inputError]}
              value={form.valid_from}
              onChangeText={(val) => updateField('valid_from', val)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.onSurfaceVariant}
            />
            {errors.valid_from && <Text style={styles.errorText}>{errors.valid_from}</Text>}
          </View>
          
          <View style={[styles.field, { flex: 1, marginLeft: spacing.md }]}>
            <Text style={styles.label}>Valid To *</Text>
            <TextInput
              style={[styles.input, errors.valid_to && styles.inputError]}
              value={form.valid_to}
              onChangeText={(val) => updateField('valid_to', val)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.onSurfaceVariant}
            />
            {errors.valid_to && <Text style={styles.errorText}>{errors.valid_to}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Saving...' : (isEditing ? 'Update Offer' : 'Create Offer')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  form: {
    padding: spacing.md,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.error,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeBtnText: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
  },
  typeBtnTextActive: {
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
});
