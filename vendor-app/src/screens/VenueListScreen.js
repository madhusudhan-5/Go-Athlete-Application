import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function VenueListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVenues = async () => {
    try {
      const response = await vendorService.getVenues(vendorId);
      setVenues(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVenues();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVenues();
  };

  const handleActivate = async (venueId) => {
    try {
      await vendorService.activateVenue(venueId);
      loadVenues();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate venue');
    }
  };

  const handleDeactivate = async (venueId) => {
    Alert.alert(
      'Deactivate Venue',
      'Are you sure you want to deactivate this venue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateVenue(venueId);
              loadVenues();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate venue');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return colors.success;
      case 'INACTIVE': return colors.error;
      case 'PENDING_VERIFICATION': return colors.warning;
      default: return colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading venues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No Venues Yet</Text>
            <Text style={styles.emptyText}>Add your first venue to get started</Text>
          </View>
        ) : (
          venues.map((venue) => (
            <View
              key={venue.id}
              style={styles.venueCard}
            >
              <View style={styles.venueHeader}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(venue.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(venue.status) }]}>
                    {venue.status}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.venueAddress}>
                {venue.address}, {venue.city}
              </Text>
              
              <View style={styles.venueInfo}>
                <Text style={styles.infoItem}>📞 {venue.phone || 'No phone'}</Text>
                <Text style={styles.infoItem}>🏸 {venue.courts_count || 0} courts</Text>
              </View>
              
              <View style={styles.venueActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditVenue', { venue })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('CourtList', { venueId: venue.id, venueName: venue.name })}
                >
                  <Text style={styles.actionBtnText}>Courts</Text>
                </TouchableOpacity>
                
                {venue.status === 'ACTIVE' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(venue.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(venue.id)}
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
        onPress={() => navigation.navigate('AddVenue')}
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
  venueCard: {
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
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  venueName: {
    ...typography.titleLarge,
    color: colors.onSurface,
    flex: 1,
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
  venueAddress: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  venueInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoItem: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  venueActions: {
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
