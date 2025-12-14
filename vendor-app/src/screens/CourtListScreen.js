import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function CourtListScreen({ navigation, route }) {
  const { venueId, venueName } = route.params;
  const { vendorId } = useVendor();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourts = async () => {
    try {
      const response = await vendorService.getCourtsByVenue(venueId);
      setCourts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load courts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, [venueId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCourts();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourts();
  };

  const handleDeactivate = async (courtId) => {
    Alert.alert(
      'Deactivate Court',
      'Are you sure you want to deactivate this court?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateCourt(courtId);
              loadCourts();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate court');
            }
          },
        },
      ]
    );
  };

  const handleActivate = async (courtId) => {
    try {
      await vendorService.activateCourt(courtId);
      loadCourts();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate court');
    }
  };

  const getSportIcon = (sport) => {
    const icons = {
      CRICKET: '🏏',
      FOOTBALL: '⚽',
      BADMINTON: '🏸',
      TENNIS: '🎾',
      BASKETBALL: '🏀',
      OTHER: '🏟️',
    };
    return icons[sport] || '🏟️';
  };

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? colors.success : colors.error;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading courts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{venueName}</Text>
        <Text style={styles.headerSubtitle}>{courts.length} courts</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {courts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏸</Text>
            <Text style={styles.emptyTitle}>No Courts Yet</Text>
            <Text style={styles.emptyText}>Add your first court to this venue</Text>
          </View>
        ) : (
          courts.map((court) => (
            <View key={court.id} style={styles.courtCard}>
              <View style={styles.courtHeader}>
                <Text style={styles.sportIcon}>{getSportIcon(court.sport_type)}</Text>
                <View style={styles.courtInfo}>
                  <Text style={styles.courtName}>{court.name}</Text>
                  <Text style={styles.courtSport}>{court.sport_type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(court.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(court.status) }]}>
                    {court.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.courtDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price/Hour</Text>
                  <Text style={styles.detailValue}>₹{court.base_price}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>{court.capacity || '-'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Slot</Text>
                  <Text style={styles.detailValue}>{court.slot_duration || 60} min</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Lights</Text>
                  <Text style={styles.detailValue}>{court.has_lights ? '✓' : '✗'}</Text>
                </View>
              </View>
              
              <View style={styles.courtActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditCourt', { court })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('SlotGenerator', { courtId: court.id, courtName: court.name })}
                >
                  <Text style={styles.actionBtnText}>Slots</Text>
                </TouchableOpacity>
                
                {court.status === 'ACTIVE' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(court.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(court.id)}
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
        onPress={() => navigation.navigate('AddCourt', { venueId })}
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
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  headerTitle: {
    ...typography.titleLarge,
    color: colors.onSurface,
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    color: colors.onSurfaceVariant,
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
  courtCard: {
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
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sportIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  courtSport: {
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
  courtDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.titleSmall,
    color: colors.onSurface,
  },
  courtActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
