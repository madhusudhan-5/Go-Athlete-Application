import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function CoachListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCoaches = async () => {
    try {
      const response = await vendorService.getCoaches(vendorId);
      setCoaches(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load coaches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCoaches();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCoaches();
  };

  const handleActivate = async (coachId) => {
    try {
      await vendorService.activateCoach(coachId);
      loadCoaches();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate coach');
    }
  };

  const handleDeactivate = async (coachId) => {
    Alert.alert(
      'Deactivate Coach',
      'Are you sure you want to deactivate this coach?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateCoach(coachId);
              loadCoaches();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate coach');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return colors.success;
      case 'PENDING': return colors.warning;
      case 'REJECTED': return colors.error;
      default: return colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading coaches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {coaches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍🏫</Text>
            <Text style={styles.emptyTitle}>No Coaches Yet</Text>
            <Text style={styles.emptyText}>Add your first coach to start offering coaching sessions</Text>
          </View>
        ) : (
          coaches.map((coach) => (
            <View key={coach.id} style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <View style={styles.coachTitleRow}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(coach.verification_status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(coach.verification_status) }]}>
                      {coach.verification_status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.coachEmail}>{coach.email}</Text>
              </View>
              
              <View style={styles.coachDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Experience:</Text>
                  <Text style={styles.detailValue}>{coach.experience_years} years</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hourly Rate:</Text>
                  <Text style={styles.detailValue}>₹{coach.hourly_rate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sessions:</Text>
                  <Text style={styles.detailValue}>{coach.total_sessions || 0}</Text>
                </View>
              </View>

              {coach.specializations && coach.specializations.length > 0 && (
                <View style={styles.tagsContainer}>
                  {coach.specializations.map((spec, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditCoach', { coach })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                {coach.is_active ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(coach.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Deactivate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(coach.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.activateBtnText]}>Activate</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.sessionsBtn]}
                  onPress={() => navigation.navigate('CoachSessions', { coachId: coach.id, coachName: coach.name })}
                >
                  <Text style={[styles.actionBtnText, styles.sessionsBtnText]}>Sessions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddCoach')}
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
  },
  coachCard: {
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
  coachHeader: {
    marginBottom: spacing.sm,
  },
  coachTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  coachName: {
    ...typography.titleMedium,
    color: colors.onSurface,
    flex: 1,
  },
  coachEmail: {
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
  coachDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.outline + '30',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.onSurface,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    ...typography.labelSmall,
    color: colors.primary,
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
  sessionsBtn: {
    backgroundColor: colors.primary + '15',
  },
  sessionsBtnText: {
    color: colors.primary,
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
