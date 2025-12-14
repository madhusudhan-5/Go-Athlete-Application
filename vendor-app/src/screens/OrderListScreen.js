import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function OrderListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [shipOrderId, setShipOrderId] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  const loadOrders = async () => {
    try {
      const response = await vendorService.getOrders(vendorId);
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleConfirm = async (orderId) => {
    try {
      await vendorService.confirmOrder(orderId);
      Alert.alert('Success', 'Order confirmed');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm order');
    }
  };

  const handleShip = (orderId) => {
    setShipOrderId(orderId);
    setTrackingNumber('');
    setShipModalVisible(true);
  };

  const confirmShip = async () => {
    try {
      await vendorService.shipOrder(shipOrderId, { tracking_number: trackingNumber });
      Alert.alert('Success', 'Order marked as shipped');
      setShipModalVisible(false);
      setShipOrderId(null);
      setTrackingNumber('');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to ship order');
    }
  };

  const handleCancel = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.cancelOrder(orderId);
              Alert.alert('Success', 'Order cancelled');
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: colors.warning,
      CONFIRMED: '#2196F3',
      SHIPPED: '#9C27B0',
      DELIVERED: colors.success,
      CANCELLED: colors.error,
      RETURNED: '#FF9800',
    };
    return statusColors[status] || colors.onSurfaceVariant;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'All' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>Orders will appear here when customers purchase products</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderTitleRow}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.customerSection}>
                  <Text style={styles.sectionLabel}>Customer</Text>
                  <Text style={styles.customerName}>{order.customer_name || 'Unknown'}</Text>
                  <Text style={styles.customerPhone}>{order.customer_phone || '-'}</Text>
                </View>
                
                <View style={styles.amountSection}>
                  <Text style={styles.sectionLabel}>Total</Text>
                  <Text style={styles.totalAmount}>₹{order.total_amount}</Text>
                  <Text style={styles.itemsCount}>{order.items_count || 0} items</Text>
                </View>
              </View>

              <View style={styles.paymentRow}>
                <View style={[styles.paymentBadge, { backgroundColor: order.payment_status === 'PAID' ? colors.success + '20' : colors.warning + '20' }]}>
                  <Text style={{ color: order.payment_status === 'PAID' ? colors.success : colors.warning, fontSize: 11, fontWeight: '600' }}>
                    {order.payment_status}
                  </Text>
                </View>
                <Text style={styles.paymentMethod}>{order.payment_method || 'N/A'}</Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                >
                  <Text style={styles.actionBtnText}>View Details</Text>
                </TouchableOpacity>
                
                {order.status === 'PENDING' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.confirmBtn]}
                      onPress={() => handleConfirm(order.id)}
                    >
                      <Text style={[styles.actionBtnText, styles.confirmBtnText]}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => handleCancel(order.id)}
                    >
                      <Text style={[styles.actionBtnText, styles.cancelBtnText]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {order.status === 'CONFIRMED' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.shipBtn]}
                    onPress={() => handleShip(order.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.shipBtnText]}>Ship Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={shipModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ship Order</Text>
            <Text style={styles.modalSubtitle}>Enter tracking number (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tracking number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholderTextColor={colors.onSurfaceVariant}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShipModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={confirmShip}
              >
                <Text style={styles.modalConfirmText}>Ship Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    marginBottom: spacing.sm,
  },
  orderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNumber: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  orderDate: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.outline + '30',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  customerSection: {
    flex: 1,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  customerName: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    fontWeight: '500',
  },
  customerPhone: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  totalAmount: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  itemsCount: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  paymentMethod: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.outline + '30',
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  actionBtnText: {
    ...typography.labelMedium,
    color: colors.onSurfaceVariant,
  },
  confirmBtn: {
    backgroundColor: colors.success + '20',
  },
  confirmBtnText: {
    color: colors.success,
  },
  cancelBtn: {
    backgroundColor: colors.error + '20',
  },
  cancelBtnText: {
    color: colors.error,
  },
  shipBtn: {
    backgroundColor: '#9C27B0' + '20',
  },
  shipBtnText: {
    color: '#9C27B0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyMedium,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modalCancelText: {
    ...typography.labelLarge,
    color: colors.onSurfaceVariant,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modalConfirmText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
  },
});
