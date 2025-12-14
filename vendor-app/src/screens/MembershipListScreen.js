import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function MembershipListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMemberships = async () => {
    try {
      const response = await vendorService.getMemberships(vendorId);
      setMemberships(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load memberships:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMemberships();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMemberships();
  };

  const handleActivate = async (membershipId) => {
    try {
      await vendorService.activateMembership(membershipId);
      loadMemberships();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate membership');
    }
  };

  const handleDeactivate = async (membershipId) => {
    Alert.alert(
      'Deactivate Membership',
      'This will prevent new sign-ups for this membership plan. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateMembership(membershipId);
              loadMemberships();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate membership');
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SESSION': return '🎯';
      case 'CREDIT': return '💳';
      case 'UNLIMITED': return '♾️';
      default: return '📋';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'SESSION': return '#2196F3';
      case 'CREDIT': return '#9C27B0';
      case 'UNLIMITED': return '#4CAF50';
      default: return colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading memberships...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {memberships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>No Membership Plans</Text>
            <Text style={styles.emptyText}>Create membership plans to offer subscriptions to your customers</Text>
          </View>
        ) : (
          memberships.map((membership) => (
            <View key={membership.id} style={styles.membershipCard}>
              <View style={styles.membershipHeader}>
                <View style={styles.membershipTitleRow}>
                  <View style={styles.titleWithIcon}>
                    <Text style={styles.typeIcon}>{getTypeIcon(membership.membership_type)}</Text>
                    <Text style={styles.membershipName}>{membership.name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: membership.is_active ? colors.success + '20' : colors.error + '20' }]}>
                    <Text style={{ color: membership.is_active ? colors.success : colors.error, fontSize: 11, fontWeight: '600' }}>
                      {membership.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
                {membership.description && (
                  <Text style={styles.membershipDescription} numberOfLines={2}>
                    {membership.description}
                  </Text>
                )}
              </View>
              
              <View style={styles.membershipDetails}>
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <View style={styles.priceRow}>
                    {membership.discount_percentage > 0 && (
                      <Text style={styles.originalPrice}>₹{membership.price}</Text>
                    )}
                    <Text style={styles.currentPrice}>
                      ₹{(membership.price * (1 - membership.discount_percentage / 100)).toFixed(0)}
                    </Text>
                    {membership.discount_percentage > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{membership.discount_percentage}% OFF</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.validitySection}>
                  <Text style={styles.validityLabel}>Validity</Text>
                  <Text style={styles.validityValue}>{membership.validity_days} days</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(membership.membership_type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(membership.membership_type) }]}>
                    {membership.membership_type}
                  </Text>
                </View>
                {membership.membership_type === 'SESSION' && (
                  <Text style={styles.featureText}>{membership.sessions_count} sessions</Text>
                )}
                {membership.membership_type === 'CREDIT' && (
                  <Text style={styles.featureText}>{membership.credits_count} credits</Text>
                )}
                {membership.auto_renewal && (
                  <View style={styles.autoRenewBadge}>
                    <Text style={styles.autoRenewText}>Auto-renew</Text>
                  </View>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{membership.active_members || 0}</Text>
                  <Text style={styles.statLabel}>Active Members</Text>
                </View>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditMembership', { membership })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.membersBtn]}
                  onPress={() => navigation.navigate('MembershipMembers', { membershipId: membership.id, membershipName: membership.name })}
                >
                  <Text style={[styles.actionBtnText, styles.membersBtnText]}>View Members</Text>
                </TouchableOpacity>
                {membership.is_active ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(membership.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(membership.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.activateBtnText]}>Activate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddMembership')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  membershipCard: {
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
  membershipHeader: {
    marginBottom: spacing.sm,
  },
  membershipTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  membershipName: {
    ...typography.titleMedium,
    color: colors.onSurface,
    flex: 1,
  },
  membershipDescription: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  membershipDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.outline + '30',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  originalPrice: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...typography.labelSmall,
    color: colors.success,
    fontWeight: '600',
  },
  validitySection: {
    alignItems: 'flex-end',
  },
  validityLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  validityValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  typeText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  autoRenewBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  autoRenewText: {
    ...typography.labelSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.outline + '30',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  statValue: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.labelSmall,
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
  membersBtn: {
    backgroundColor: colors.primary + '15',
  },
  membersBtnText: {
    color: colors.primary,
  },
  activateBtn: {
    backgroundColor: colors.success + '20',
  },
  activateBtnText: {
    color: colors.success,
  },
  deactivateBtn: {
    backgroundColor: colors.error + '20',
  },
  deactivateBtnText: {
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.onPrimary,
    marginTop: -2,
  },
});
