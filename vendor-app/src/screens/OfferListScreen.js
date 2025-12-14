import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function OfferListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOffers = async () => {
    try {
      const response = await vendorService.getOffers(vendorId);
      setOffers(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOffers();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const handleActivate = async (offerId) => {
    try {
      await vendorService.activateOffer(offerId);
      loadOffers();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate offer');
    }
  };

  const handleDeactivate = async (offerId) => {
    Alert.alert(
      'Deactivate Offer',
      'Are you sure you want to deactivate this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateOffer(offerId);
              loadOffers();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate offer');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (active) => {
    return active ? colors.success : colors.error;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading offers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No Offers Yet</Text>
            <Text style={styles.emptyText}>Create your first discount offer</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerTitleRow}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.active) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(offer.active) }]}>
                      {offer.active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
                {offer.description && (
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                )}
              </View>
              
              <View style={styles.offerDetails}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {offer.discount_type === 'PERCENT' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                  </Text>
                </View>
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>
                    {formatDate(offer.valid_from)} - {formatDate(offer.valid_to)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditOffer', { offer })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                
                {offer.active ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(offer.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(offer.id)}
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
        onPress={() => navigation.navigate('AddOffer')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
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
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  offerHeader: {
    marginBottom: spacing.md,
  },
  offerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offerTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    flex: 1,
  },
  offerDescription: {
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
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  discountBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  discountText: {
    ...typography.titleMedium,
    color: colors.accent,
    fontWeight: 'bold',
  },
  dateInfo: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  actionBtnText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  deactivateBtn: {
    backgroundColor: colors.error + '10',
  },
  deactivateBtnText: {
    color: colors.error,
  },
  activateBtn: {
    backgroundColor: colors.success + '10',
  },
  activateBtnText: {
    color: colors.success,
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
  fabIcon: {
    fontSize: 28,
    color: colors.onPrimary,
    marginTop: -2,
  },
});
