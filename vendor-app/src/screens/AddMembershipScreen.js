import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { colors, spacing, typography, shape, elevation } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function AddMembershipScreen({ navigation, route }) {
  const { vendorId } = useVendor();
  const editMembership = route.params?.membership;
  const isEditMode = !!editMembership;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: editMembership?.name || '',
    description: editMembership?.description || '',
    membership_type: editMembership?.membership_type || 'SESSION',
    sessions_count: editMembership?.sessions_count?.toString() || '10',
    credits_count: editMembership?.credits_count?.toString() || '100',
    validity_days: editMembership?.validity_days?.toString() || '30',
    price: editMembership?.price?.toString() || '',
    discount_percentage: editMembership?.discount_percentage?.toString() || '0',
    renewal_reminder_days: editMembership?.renewal_reminder_days?.toString() || '7',
    auto_renewal: editMembership?.auto_renewal || false,
    applicable_services: editMembership?.applicable_services?.join(', ') || '',
  });

  const handleSave = async () => {
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Membership name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage('Valid price is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vendor: vendorId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        membership_type: formData.membership_type,
        sessions_count: parseInt(formData.sessions_count) || 0,
        credits_count: parseInt(formData.credits_count) || 0,
        validity_days: parseInt(formData.validity_days) || 30,
        price: parseFloat(formData.price),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        renewal_reminder_days: parseInt(formData.renewal_reminder_days) || 7,
        auto_renewal: formData.auto_renewal,
        applicable_services: formData.applicable_services.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (isEditMode) {
        await vendorService.updateMembership(editMembership.id, payload);
      } else {
        await vendorService.createMembership(payload);
      }

      if (Platform.OS === 'web') {
        navigation.goBack();
      } else {
        Alert.alert('Success', isEditMode ? 'Membership updated!' : 'Membership created!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save membership';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const membershipTypes = [
    { value: 'SESSION', label: 'Session Based', icon: '🎯' },
    { value: 'CREDIT', label: 'Credit Based', icon: '💳' },
    { value: 'UNLIMITED', label: 'Unlimited', icon: '♾️' },
    { value: 'TIME', label: 'Time Based', icon: '⏰' },
  ];

  const getTypeDescription = (type) => {
    switch (type) {
      case 'SESSION':
        return 'Members get a fixed number of sessions to use';
      case 'CREDIT':
        return 'Members get credits to spend on any service';
      case 'UNLIMITED':
        return 'Members get unlimited access during validity';
      case 'TIME':
        return 'Members get access for a fixed time period';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Membership Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Gold Membership"
            placeholderTextColor={colors.outline}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe the benefits of this membership"
            placeholderTextColor={colors.outline}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Type</Text>
          <View style={styles.typeContainer}>
            {membershipTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  formData.membership_type === type.value && styles.typeCardSelected
                ]}
                onPress={() => setFormData({ ...formData, membership_type: type.value })}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  formData.membership_type === type.value && styles.typeLabelSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.typeDescription}>
            {getTypeDescription(formData.membership_type)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limits & Validity</Text>

          {formData.membership_type === 'SESSION' && (
            <>
              <Text style={styles.label}>Number of Sessions</Text>
              <TextInput
                style={styles.input}
                value={formData.sessions_count}
                onChangeText={(text) => setFormData({ ...formData, sessions_count: text })}
                placeholder="10"
                placeholderTextColor={colors.outline}
                keyboardType="numeric"
              />
            </>
          )}

          {formData.membership_type === 'CREDIT' && (
            <>
              <Text style={styles.label}>Credit Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.credits_count}
                onChangeText={(text) => setFormData({ ...formData, credits_count: text })}
                placeholder="100"
                placeholderTextColor={colors.outline}
                keyboardType="numeric"
              />
            </>
          )}

          <Text style={styles.label}>Validity (Days)</Text>
          <TextInput
            style={styles.input}
            value={formData.validity_days}
            onChangeText={(text) => setFormData({ ...formData, validity_days: text })}
            placeholder="30"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />
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
          <Text style={styles.sectionTitle}>Renewal Settings</Text>

          <Text style={styles.label}>Reminder Days Before Expiry</Text>
          <TextInput
            style={styles.input}
            value={formData.renewal_reminder_days}
            onChangeText={(text) => setFormData({ ...formData, renewal_reminder_days: text })}
            placeholder="7"
            placeholderTextColor={colors.outline}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Auto-Renewal</Text>
            <Switch
              value={formData.auto_renewal}
              onValueChange={(value) => setFormData({ ...formData, auto_renewal: value })}
              trackColor={{ false: colors.outline, true: colors.primary + '80' }}
              thumbColor={formData.auto_renewal ? colors.primary : colors.surfaceVariant}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicable Services</Text>
          <Text style={styles.label}>Services (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.applicable_services}
            onChangeText={(text) => setFormData({ ...formData, applicable_services: text })}
            placeholder="Court Booking, Coaching, Equipment"
            placeholderTextColor={colors.outline}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Membership' : 'Add Membership')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
    borderRadius: shape.cornerSmall,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: '#721c24',
    ...typography.bodyMedium,
    textAlign: 'center',
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: shape.corner,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
  },
  typeCardSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  typeLabel: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  typeDescription: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.bodyLarge,
    color: colors.onSurface,
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
