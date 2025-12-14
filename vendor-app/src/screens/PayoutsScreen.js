import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, FlatList } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function PayoutsScreen({ navigation, route }) {
  const { vendorId } = useVendor();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const loadPayoutData = async () => {
    try {
      const response = await vendorService.getPayoutSummary(vendorId);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load payout data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayoutData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayoutData();
  };

  const getNextPayoutDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleRequestPayout = async () => {
    if (!data || data.pending_payout <= 0) {
      Alert.alert('No Pending Amount', 'There is no pending payout to request.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Are you sure you want to request a payout of ₹${data.pending_payout?.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setRequesting(true);
            try {
              await vendorService.requestPayout(vendorId);
              Alert.alert('Success', 'Payout request submitted successfully. You will be notified once processed.');
              loadPayoutData();
            } catch (error) {
              const errorMsg = error.response?.data?.error || 'Failed to request payout';
              Alert.alert('Error', errorMsg);
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.accent;
      case 'failed':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const renderPayout = ({ item }) => (
    <View style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <Text style={styles.payoutDate}>
          {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.payoutDetails}>
        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Gross Amount</Text>
          <Text style={styles.payoutValue}>₹{item.gross_amount?.toLocaleString()}</Text>
        </View>
        <View style={styles.payoutRow}>
          <Text style={styles.payoutLabel}>Commission</Text>
          <Text style={[styles.payoutValue, { color: colors.error }]}>-₹{item.commission?.toLocaleString()}</Text>
        </View>
        <View style={[styles.payoutRow, styles.payoutRowTotal]}>
          <Text style={styles.payoutLabelBold}>Net Amount</Text>
          <Text style={styles.payoutValueBold}>₹{item.net_amount?.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading payout data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Payouts</Text>

      <View style={styles.summaryCard}>
        <View style={styles.pendingSection}>
          <Text style={styles.pendingLabel}>Pending Payout</Text>
          <Text style={styles.pendingAmount}>₹{data?.pending_payout?.toLocaleString() || '0'}</Text>
          <Text style={styles.nextPayoutDate}>Next payout: {getNextPayoutDate()}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.requestBtn, (data?.pending_payout <= 0 || requesting) && styles.requestBtnDisabled]}
          onPress={handleRequestPayout}
          disabled={data?.pending_payout <= 0 || requesting}
        >
          <Text style={styles.requestBtnText}>
            {requesting ? 'Requesting...' : 'Request Payout'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Earnings Summary</Text>
        
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Total Earned</Text>
          <Text style={styles.earningsValue}>₹{data?.total_earned?.toLocaleString() || '0'}</Text>
        </View>
        
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Platform Commission ({data?.commission_rate || 0}%)</Text>
          <Text style={[styles.earningsValue, { color: colors.error }]}>
            -₹{data?.total_commission?.toLocaleString() || '0'}
          </Text>
        </View>
        
        <View style={[styles.earningsRow, styles.earningsRowTotal]}>
          <Text style={styles.earningsLabelBold}>Net Earnings</Text>
          <Text style={styles.earningsValueBold}>₹{data?.net_earnings?.toLocaleString() || '0'}</Text>
        </View>
        
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Total Paid Out</Text>
          <Text style={[styles.earningsValue, { color: colors.success }]}>
            ₹{data?.total_paid?.toLocaleString() || '0'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        
        {data?.recent_payouts?.length > 0 ? (
          <FlatList
            data={data.recent_payouts}
            renderItem={renderPayout}
            keyExtractor={(item) => item.id?.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>No payouts yet</Text>
            <Text style={styles.emptySubtext}>Your payout history will appear here</Text>
          </View>
        )}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.headlineMedium,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  pendingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pendingLabel: {
    ...typography.bodyLarge,
    color: colors.onPrimary,
    opacity: 0.8,
  },
  pendingAmount: {
    ...typography.headlineLarge,
    color: colors.onPrimary,
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: spacing.sm,
  },
  nextPayoutDate: {
    ...typography.bodyMedium,
    color: colors.onPrimary,
    opacity: 0.7,
  },
  requestBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  requestBtnDisabled: {
    opacity: 0.5,
  },
  requestBtnText: {
    ...typography.labelLarge,
    color: colors.onAccent,
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
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  earningsRowTotal: {
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  earningsLabel: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  earningsValue: {
    ...typography.bodyLarge,
    color: colors.onSurface,
  },
  earningsLabelBold: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  earningsValueBold: {
    ...typography.titleLarge,
    color: colors.primary,
  },
  payoutCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  payoutDate: {
    ...typography.labelLarge,
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    ...typography.labelLarge,
    color: colors.onPrimary,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  payoutDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.sm,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  payoutRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  payoutLabel: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  payoutValue: {
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  payoutLabelBold: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  payoutValueBold: {
    ...typography.titleMedium,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
});
