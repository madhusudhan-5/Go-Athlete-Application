import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function CalendarScreen({ route }) {
  const { vendorId } = useVendor();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      loadSlots();
    }
  }, [selectedCourt, selectedDate]);

  const loadCourts = async () => {
    try {
      const response = await vendorService.getCourts(vendorId);
      const courtList = response.data.results || response.data || [];
      setCourts(courtList);
      if (courtList.length > 0) {
        setSelectedCourt(courtList[0]);
      }
    } catch (error) {
      console.error('Failed to load courts:', error);
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const response = await vendorService.generateSlots(selectedCourt.id, selectedDate);
      setSlots(response.data || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en', { month: 'short' }),
      });
    }
    return days;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const openBookingModal = (slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setBookingForm({ customer_name: '', customer_phone: '', customer_email: '' });
    setBookingModalVisible(true);
  };

  const handleCreateBooking = async () => {
    if (!bookingForm.customer_name || !bookingForm.customer_phone) {
      Alert.alert('Required', 'Please enter customer name and phone');
      return;
    }

    setBookingLoading(true);
    try {
      await vendorService.createBooking({
        court_id: selectedCourt.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        ...bookingForm,
      });
      Alert.alert('Success', 'Booking created successfully');
      setBookingModalVisible(false);
      loadSlots();
    } catch (error) {
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderSlot = ({ item }) => (
    <TouchableOpacity 
      style={[styles.slotCard, !item.is_available && styles.slotBooked]}
      onPress={() => openBookingModal(item)}
      disabled={!item.is_available}
    >
      <Text style={[styles.slotTime, !item.is_available && styles.slotTextBooked]}>
        {formatTime(item.start_time)} - {formatTime(item.end_time)}
      </Text>
      <Text style={[styles.slotStatus, !item.is_available && styles.slotTextBooked]}>
        {item.is_available ? 'Available' : 'Booked'}
      </Text>
      {item.is_available && (
        <Text style={styles.slotRate}>₹{selectedCourt?.hourly_rate || 500}</Text>
      )}
    </TouchableOpacity>
  );

  const BookingModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={bookingModalVisible}
      onRequestClose={() => setBookingModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Booking</Text>
          <Text style={styles.modalSubtitle}>
            {selectedCourt?.name} - {selectedDate}
          </Text>
          <Text style={styles.modalTime}>
            {formatTime(selectedSlot?.start_time)} - {formatTime(selectedSlot?.end_time)}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_name}
              onChangeText={(v) => setBookingForm({ ...bookingForm, customer_name: v })}
              placeholder="Enter customer name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_phone}
              onChangeText={(v) => setBookingForm({ ...bookingForm, customer_phone: v })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_email}
              onChangeText={(v) => setBookingForm({ ...bookingForm, customer_email: v })}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>₹{selectedCourt?.hourly_rate || 500}</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setBookingModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={handleCreateBooking}
              disabled={bookingLoading}
            >
              <Text style={styles.confirmBtnText}>
                {bookingLoading ? 'Creating...' : 'Create Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>

      <BookingModal />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {getDaysOfWeek().map((day) => (
          <TouchableOpacity
            key={day.date}
            style={[styles.dateCard, selectedDate === day.date && styles.dateCardSelected]}
            onPress={() => setSelectedDate(day.date)}
          >
            <Text style={[styles.dateDay, selectedDate === day.date && styles.dateDaySelected]}>
              {day.day}
            </Text>
            <Text style={[styles.dateNum, selectedDate === day.date && styles.dateNumSelected]}>
              {day.dayNum}
            </Text>
            <Text style={[styles.dateMonth, selectedDate === day.date && styles.dateDaySelected]}>
              {day.month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courtScroll}>
        {courts.map((court) => (
          <TouchableOpacity
            key={court.id}
            style={[styles.courtChip, selectedCourt?.id === court.id && styles.courtChipSelected]}
            onPress={() => setSelectedCourt(court)}
          >
            <Text style={[styles.courtChipText, selectedCourt?.id === court.id && styles.courtChipTextSelected]}>
              {court.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.outline }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text>Loading slots...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          renderItem={renderSlot}
          keyExtractor={(item, index) => `${item.start_time}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.slotRow}
          contentContainerStyle={styles.slotList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>
                {selectedCourt ? 'No slots available for this date' : 'Select a court to view slots'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  dateScroll: {
    marginBottom: spacing.md,
    maxHeight: 90,
  },
  dateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
  },
  dateDay: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  dateDaySelected: {
    color: colors.onPrimary,
  },
  dateNum: {
    ...typography.titleLarge,
    color: colors.onSurface,
  },
  dateNumSelected: {
    color: colors.onPrimary,
  },
  dateMonth: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  courtScroll: {
    marginBottom: spacing.sm,
    maxHeight: 50,
  },
  courtChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  courtChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  courtChipText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  courtChipTextSelected: {
    color: colors.onAccent,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotList: {
    paddingBottom: spacing.xl,
  },
  slotRow: {
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.success,
  },
  slotBooked: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
  },
  slotTime: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  slotTextBooked: {
    color: colors.onSurfaceVariant,
  },
  slotStatus: {
    ...typography.bodyMedium,
    color: colors.success,
    marginTop: spacing.xs,
  },
  slotRate: {
    ...typography.titleMedium,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodyLarge,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  modalTime: {
    ...typography.titleMedium,
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.bodyLarge,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  priceLabel: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  priceValue: {
    ...typography.headlineMedium,
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
});
