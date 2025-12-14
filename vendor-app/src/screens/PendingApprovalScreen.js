import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useVendor } from '../context/VendorContext';
import { authService } from '../services/api';
import { spacing, typography, shape, elevation } from '../theme';

export default function PendingApprovalScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { vendorStatus, setVendorStatus, clearVendorData } = useVendor();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const navigateToMain = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  useEffect(() => {
    if (vendorStatus === 'APPROVED') {
      navigateToMain();
    }
  }, [vendorStatus, navigateToMain]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const response = await authService.checkStatus();
      const newStatus = response.vendor?.status;
      if (newStatus) {
        await setVendorStatus(newStatus);
        if (newStatus === 'APPROVED') {
          navigateToMain();
          return;
        }
      }
      setMessage('Your account is still pending approval.');
    } catch (error) {
      setMessage('Unable to check status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    await clearVendorData();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const getStatusInfo = () => {
    switch (vendorStatus) {
      case 'PENDING':
        return {
          icon: '⏳',
          title: 'Pending Approval',
          description: 'Your account is under review. Our team is verifying your documents and will approve your account shortly.',
          color: colors.warning,
        };
      case 'REJECTED':
        return {
          icon: '❌',
          title: 'Application Rejected',
          description: 'Unfortunately, your application was not approved. Please contact support for more information or submit a new application.',
          color: colors.error,
        };
      case 'SUSPENDED':
        return {
          icon: '🚫',
          title: 'Account Suspended',
          description: 'Your account has been temporarily suspended. Please contact support to resolve this issue.',
          color: colors.error,
        };
      default:
        return {
          icon: '⏳',
          title: 'Pending Approval',
          description: 'Please wait while we review your application.',
          color: colors.warning,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: shape.corner * 2,
      padding: spacing.xl,
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
      ...elevation.level2,
    },
    icon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.headlineMedium,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    description: {
      ...typography.bodyLarge,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: 24,
    },
    statusBadge: {
      backgroundColor: statusInfo.color + '20',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: shape.cornerFull,
      marginBottom: spacing.xl,
    },
    statusText: {
      ...typography.labelLarge,
      color: statusInfo.color,
      fontWeight: '600',
    },
    refreshButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: shape.corner,
      width: '100%',
      alignItems: 'center',
      marginBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    refreshButtonText: {
      ...typography.labelLarge,
      color: colors.onPrimary,
    },
    logoutButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: shape.corner,
      width: '100%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    logoutButtonText: {
      ...typography.labelLarge,
      color: colors.onSurface,
    },
    message: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    helpText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    supportLink: {
      color: colors.primary,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{vendorStatus}</Text>
        </View>
        
        <Text style={styles.title}>{statusInfo.title}</Text>
        <Text style={styles.description}>{statusInfo.description}</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>Check Status</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        {message ? <Text style={styles.message}>{message}</Text> : null}
        
        <Text style={styles.helpText}>
          Need help? <Text style={styles.supportLink}>Contact Support</Text>
        </Text>
      </View>
    </View>
  );
}
