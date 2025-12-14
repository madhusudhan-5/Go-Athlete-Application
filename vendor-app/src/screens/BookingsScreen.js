import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Modal, 
  TextInput, 
  Alert,
  Animated,
  Platform,
  useWindowDimensions
} from 'react-native';
import { colors, spacing, shape, elevation, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

const SkeletonLoader = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return <Animated.View style={[styles.skeleton, style, { opacity }]} />;
};

const SkeletonCard = () => (
  <View style={styles.bookingCard}>
    <View style={styles.bookingHeader}>
      <View>
        <SkeletonLoader style={{ width: 60, height: 20, marginBottom: 4 }} />
        <SkeletonLoader style={{ width: 100, height: 14 }} />
      </View>
      <SkeletonLoader style={{ width: 70, height: 24, borderRadius: shape.cornerFull }} />
    </View>
    <View style={styles.bookingBody}>
      <SkeletonLoader style={{ width: 150, height: 18, marginBottom: 6 }} />
      <SkeletonLoader style={{ width: 120, height: 14, marginBottom: 6 }} />
      <SkeletonLoader style={{ width: 100, height: 16 }} />
    </View>
    <View style={styles.bookingFooter}>
      <SkeletonLoader style={{ width: 60, height: 24 }} />
      <SkeletonLoader style={{ width: 80, height: 14 }} />
    </View>
  </View>
);

export default function BookingsScreen({ navigation }) {
  const { vendorId } = useVendor();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadBookings = async () => {
    try {
      const response = await vendorService.getBookings(vendorId);
      const bookingList = response.data.results || response.data || [];
      setBookings(bookingList);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'completed': return '#4CAF50';
      case 'cancelled': return colors.error;
      case 'pending': return colors.secondary;
      case 'refunded': return '#9C27B0';
      default: return colors.onSurfaceVariant;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'confirmed': return 'rgba(46, 125, 50, 0.1)';
      case 'completed': return 'rgba(76, 175, 80, 0.1)';
      case 'cancelled': return 'rgba(179, 38, 30, 0.1)';
      case 'pending': return 'rgba(217, 106, 35, 0.1)';
      case 'refunded': return 'rgba(156, 39, 176, 0.1)';
      default: return 'rgba(0, 0, 0, 0.05)';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openActionModal = (booking) => {
    setSelectedBooking(booking);
    setSmsMessage(`Hello, regarding your booking #${booking.id} at ${booking.court_name} on ${formatDate(booking.booking_date)}...`);
    setActionModalVisible(true);
  };

  const handleAction = async (action) => {
    if (!selectedBooking) return;
    
    setActionLoading(true);
    try {
      let message = '';
      
      switch (action) {
        case 'reschedule':
          await vendorService.rescheduleBooking(selectedBooking.id, {});
          message = `Your booking #${selectedBooking.id} is being rescheduled.`;
          break;
        case 'cancel':
          await vendorService.cancelBooking(selectedBooking.id);
          message = `Your booking #${selectedBooking.id} has been cancelled.`;
          break;
        case 'refund':
          await vendorService.refundBooking(selectedBooking.id);
          message = `Your booking #${selectedBooking.id} has been refunded.`;
          break;
        case 'sms':
          message = smsMessage;
          break;
      }

      const phoneNumber = selectedBooking.customer_phone || '+1234567890';
      if (message) {
        try {
          await vendorService.sendSMS(phoneNumber, message);
        } catch (smsError) {
          console.log('SMS failed (may be in LOG mode):', smsError);
        }
      }
      
      Alert.alert('Success', `${action === 'sms' ? 'SMS sent' : `Booking ${action}d`} successfully`);
      setActionModalVisible(false);
      loadBookings();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} booking`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const FilterChip = ({ label, value }) => (
    <TouchableOpacity 
      style={[styles.filterChip, filter === value && styles.filterChipActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterChipText, filter === value && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderBooking = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => openActionModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View>
          <Text style={styles.bookingId}>#{item.id}</Text>
          <Text style={styles.bookingDate}>{formatDate(item.booking_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.bookingBody}>
        <Text style={styles.courtName}>{item.court_name}</Text>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.bookingTime}>
          {formatTime(item.start_time)} - {formatTime(item.end_time)}
        </Text>
      </View>
      
      <View style={styles.bookingFooter}>
        <Text style={styles.amount}>₹{item.amount}</Text>
        <Text style={styles.tapHint}>Tap for actions</Text>
      </View>
    </TouchableOpacity>
  );

  const containerStyle = [
    styles.container,
    isWeb && width > 768 && styles.webContainer
  ];

  return (
    <View style={styles.screenContainer}>
      <View style={containerStyle}>
        <View style={styles.header}>
          <Text style={styles.title}>Bookings</Text>
        </View>

        <View style={styles.filterRow}>
          <FilterChip label="All" value="all" />
          <FilterChip label="Confirmed" value="confirmed" />
          <FilterChip label="Pending" value="pending" />
          <FilterChip label="Cancelled" value="cancelled" />
        </View>
        
        <Modal
          animationType="fade"
          transparent={true}
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Booking #{selectedBooking?.id}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedBooking?.court_name} - {formatDate(selectedBooking?.booking_date)}
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnReschedule]}
                  onPress={() => handleAction('reschedule')}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnIcon}>📅</Text>
                  <Text style={styles.actionBtnText}>Reschedule</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnCancel]}
                  onPress={() => handleAction('cancel')}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnIcon}>❌</Text>
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnRefund]}
                  onPress={() => handleAction('refund')}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionBtnIcon}>💰</Text>
                  <Text style={styles.actionBtnText}>Refund</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.smsSection}>
                <Text style={styles.smsLabel}>Send Custom SMS</Text>
                <TextInput
                  style={styles.smsInput}
                  value={smsMessage}
                  onChangeText={setSmsMessage}
                  placeholder="Enter message to customer"
                  placeholderTextColor={colors.outline}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity 
                  style={styles.sendSmsBtn}
                  onPress={() => handleAction('sms')}
                  disabled={actionLoading}
                >
                  <Text style={styles.sendSmsBtnText}>
                    {actionLoading ? 'Sending...' : 'Send SMS'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.closeBtn}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {loading ? (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBooking}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>Your bookings will appear here</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  webContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: shape.cornerSmall,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  skeleton: {
    backgroundColor: colors.outlineVariant,
    borderRadius: shape.cornerSmall,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: shape.corner,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...elevation.level1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingId: {
    ...typography.titleMedium,
    color: colors.primary,
  },
  bookingDate: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: shape.cornerFull,
  },
  statusText: {
    ...typography.labelSmall,
    textTransform: 'capitalize',
  },
  bookingBody: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  courtName: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  customerName: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  bookingTime: {
    ...typography.label,
    color: colors.secondary,
    marginTop: spacing.sm,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    ...typography.title,
    color: colors.primary,
  },
  tapHint: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...typography.title,
    color: colors.onSurface,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: shape.corner,
    borderTopRightRadius: shape.corner,
    padding: spacing.lg,
    maxHeight: '80%',
    ...elevation.level5,
  },
  modalTitle: {
    ...typography.title,
    color: colors.primary,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: shape.corner,
    minWidth: 90,
  },
  actionBtnReschedule: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  actionBtnCancel: {
    backgroundColor: 'rgba(179, 38, 30, 0.1)',
  },
  actionBtnRefund: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  actionBtnIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionBtnText: {
    ...typography.label,
    color: colors.onSurface,
    fontSize: 12,
  },
  smsSection: {
    marginBottom: spacing.lg,
  },
  smsLabel: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  smsInput: {
    backgroundColor: colors.background,
    borderRadius: shape.corner,
    padding: spacing.md,
    ...typography.body,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  sendSmsBtn: {
    backgroundColor: colors.secondary,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    ...elevation.level1,
  },
  sendSmsBtnText: {
    ...typography.label,
    color: colors.onSecondary,
  },
  closeBtn: {
    backgroundColor: colors.background,
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    ...typography.label,
    color: colors.onSurface,
  },
});
