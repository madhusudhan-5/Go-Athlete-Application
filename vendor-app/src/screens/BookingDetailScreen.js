import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';

export default function BookingDetailScreen({ navigation, route }) {
  const { booking } = route.params;
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sending, setSending] = useState(false);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'pending':
        return colors.accent;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Required', 'Please enter a message');
      return;
    }
    setSending(true);
    try {
      const phoneNumber = booking.customer_phone || '+1234567890';
      await vendorService.sendSMS(phoneNumber, smsMessage);
      Alert.alert('Success', 'SMS sent successfully');
      setSmsModalVisible(false);
      setSmsMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const SMSModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={smsModalVisible}
      onRequestClose={() => setSmsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Send SMS</Text>
          <TextInput
            style={styles.smsInput}
            value={smsMessage}
            onChangeText={setSmsMessage}
            placeholder="Enter message to customer"
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setSmsModalVisible(false)}>
              <Text style={styles.modalBtnOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtn} onPress={handleSendSMS} disabled={sending}>
              <Text style={styles.modalBtnText}>{sending ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <SMSModal />
      <View style={styles.header}>
        <Text style={styles.title}>Booking #{booking.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Court Details</Text>
        <DetailRow label="Court" value={booking.court_name} />
        <DetailRow label="Vendor" value={booking.vendor_name} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <DetailRow label="Name" value={booking.customer_name} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <DetailRow label="Date" value={booking.booking_date} />
        <DetailRow label="Time" value={`${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`} />
        <DetailRow label="Amount" value={`₹${booking.amount}`} />
        {booking.adjusted_amount && (
          <DetailRow label="Adjusted Amount" value={`₹${booking.adjusted_amount}`} />
        )}
        {booking.adjustment_reason && (
          <DetailRow label="Adjustment Reason" value={booking.adjustment_reason} />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => setSmsModalVisible(true)}>
          <Text style={styles.btnOutlineText}>Send SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  btnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  btnOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  btnOutlineText: {
    ...typography.labelLarge,
    color: colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  smsInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
  modalBtnOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  modalBtnOutlineText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
});
