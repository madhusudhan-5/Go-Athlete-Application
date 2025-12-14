import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Animated,
  Platform,
  useWindowDimensions,
  Pressable
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { spacing, shape, elevation, typography, animations } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

const VENDOR_TYPE_LABELS = {
  'VENUE': 'Venue Owner',
  'COACH': 'Coach/Trainer',
  'ECOM': 'E-commerce',
  'VENUE_COACH': 'Venue + Coach',
  'ALL': 'All Services',
};

const SkeletonLoader = ({ style, colors }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[{ backgroundColor: colors.outlineVariant, borderRadius: shape.cornerSmall }, style, { opacity }]} />
  );
};

const SkeletonKPICard = ({ colors, kpiCardStyle }) => (
  <View style={[kpiCardStyle, { backgroundColor: colors.surface }]}>
    <View style={{ padding: spacing.md }}>
      <SkeletonLoader style={{ width: '60%', height: 14, marginBottom: spacing.sm }} colors={colors} />
      <SkeletonLoader style={{ width: '40%', height: 32, marginBottom: spacing.xs }} colors={colors} />
    </View>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { vendorId, vendorType, vendorStatus, hasVenueAccess, hasCoachAccess, hasEcomAccess } = useVendor();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = width > 768;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create styles at the top so all helper functions have access
  const styles = createStyles(colors);

  const loadDashboard = useCallback(async () => {
    if (!vendorId) return;
    try {
      const response = await vendorService.getDashboard(vendorId);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const KPICard = ({ title, value, subtitle, variant = 'default', icon }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const getVariantStyles = () => {
      switch (variant) {
        case 'accent':
          return { borderLeftColor: colors.accent, backgroundColor: colors.cardAccent || colors.surface };
        case 'success':
          return { borderLeftColor: colors.success, backgroundColor: colors.cardSuccess || colors.surface };
        case 'warning':
          return { borderLeftColor: colors.warning, backgroundColor: colors.cardWarning || colors.surface };
        case 'highlight':
          return { borderLeftColor: colors.secondary, backgroundColor: colors.cardHighlight || colors.surface };
        default:
          return { borderLeftColor: colors.primary, backgroundColor: colors.surface };
      }
    };

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const variantStyles = getVariantStyles();

    return (
      <Animated.View 
        style={[
          styles.kpiCard, 
          variantStyles,
          { transform: [{ scale: scaleAnim }] },
          isHovered && isWeb && styles.kpiCardHovered
        ]}
      >
        <Pressable 
          style={styles.kpiCardInner}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
        >
          <Text style={[styles.kpiLabel, { color: colors.onSurfaceVariant }]}>{title}</Text>
          <Text style={[styles.kpiValue, { color: colors.onSurface }]}>{value}</Text>
          {subtitle && <Text style={[styles.kpiSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
        </Pressable>
      </Animated.View>
    );
  };

  const QuickAction = ({ icon, label, onPress, variant = 'filled' }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const isFilled = variant === 'filled';

    return (
      <Animated.View style={[styles.quickActionWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable 
          style={[
            styles.quickAction, 
            { 
              backgroundColor: isFilled ? colors.primary : colors.surface,
              borderColor: colors.primary,
              borderWidth: isFilled ? 0 : 1.5,
            },
            isHovered && isWeb && (isFilled ? styles.quickActionHovered : styles.quickActionOutlineHovered)
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
        >
          <Text style={styles.quickActionIcon}>{icon}</Text>
          <Text style={[styles.quickActionText, { color: isFilled ? colors.onPrimary : colors.primary }]}>
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderStatusBanner = () => {
    if (vendorStatus === 'APPROVED') return null;
    
    const statusConfig = {
      'PENDING': {
        bg: colors.cardWarning || '#FFF3E0',
        color: colors.warning || '#E65100',
        icon: '⏳',
        message: 'Your account is pending approval. Some features may be limited.',
      },
      'SUSPENDED': {
        bg: '#FFEBEE',
        color: colors.error,
        icon: '🚫',
        message: 'Your account has been suspended. Please contact support.',
      },
      'REJECTED': {
        bg: '#FFEBEE',
        color: colors.error,
        icon: '❌',
        message: 'Your application was rejected. Please contact support.',
      },
    };
    
    const config = statusConfig[vendorStatus] || statusConfig['PENDING'];
    
    return (
      <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={[styles.statusText, { color: config.color }]}>{config.message}</Text>
      </View>
    );
  };

  const renderKPIs = () => {
    if (loading) {
      return (
        <View style={styles.kpiGrid}>
          <SkeletonKPICard colors={colors} kpiCardStyle={styles.kpiCard} />
          <SkeletonKPICard colors={colors} kpiCardStyle={styles.kpiCard} />
          <SkeletonKPICard colors={colors} kpiCardStyle={styles.kpiCard} />
          <SkeletonKPICard colors={colors} kpiCardStyle={styles.kpiCard} />
        </View>
      );
    }

    const venueKPIs = [
      { title: 'Pending Bookings', value: data?.pending_bookings || '00', variant: 'default' },
      { title: 'Bookings This Month', value: data?.month_bookings || data?.total_bookings || 0, variant: 'accent' },
      { title: 'Registered Courts', value: data?.total_courts || 0, variant: 'success' },
      { title: 'Total Revenue', value: `₹${((data?.total_revenue || 0) / 1000).toFixed(0)}K`, variant: 'highlight' },
    ];

    const coachKPIs = [
      { title: 'Sessions Today', value: data?.today_sessions || 0, variant: 'default' },
      { title: 'Active Packages', value: data?.active_packages || 0, variant: 'accent' },
      { title: 'Pending Payouts', value: `₹${((data?.pending_payout || 0) / 1000).toFixed(1)}K`, variant: 'success' },
      { title: 'Total Earnings', value: `₹${((data?.total_revenue || 0) / 1000).toFixed(0)}K`, variant: 'highlight' },
    ];

    const ecomKPIs = [
      { title: 'Orders Today', value: data?.today_orders || 0, variant: 'default' },
      { title: 'Active Products', value: data?.active_products || 0, variant: 'accent' },
      { title: 'Pending Payouts', value: `₹${((data?.pending_payout || 0) / 1000).toFixed(1)}K`, variant: 'success' },
      { title: 'Total Sales', value: `₹${((data?.total_revenue || 0) / 1000).toFixed(0)}K`, variant: 'highlight' },
    ];

    let kpis = venueKPIs;
    if (vendorType === 'COACH') kpis = coachKPIs;
    if (vendorType === 'ECOM') kpis = ecomKPIs;

    return (
      <View style={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </View>
    );
  };

  const renderSecondaryKPIs = () => {
    if (loading) return null;

    const items = [
      { title: "Today's Revenue", value: `₹${(data?.today_revenue || 0).toLocaleString()}`, variant: 'accent' },
      { title: 'This Month', value: `₹${((data?.month_revenue || data?.total_revenue || 0) / 1000).toFixed(1)}K`, variant: 'success' },
      { title: 'Online Payments', value: `₹${((data?.online_payments || 0) / 1000).toFixed(1)}K`, variant: 'warning' },
      { title: 'Total Transactions', value: `₹${((data?.total_transactions || data?.total_revenue || 0) / 1000).toFixed(0)}K`, variant: 'highlight' },
    ];

    return (
      <View style={[styles.kpiGrid, { marginTop: spacing.sm }]}>
        {items.map((item, index) => (
          <KPICard key={index} {...item} />
        ))}
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [];

    if (hasVenueAccess()) {
      actions.push(
        <QuickAction key="venue" icon="🏢" label="Add Venue" onPress={() => navigation.navigate('AddVenue')} />,
        <QuickAction key="court" icon="🏸" label="Add Court" onPress={() => navigation.navigate('AddCourt')} />,
        <QuickAction key="calendar" icon="📅" label="Calendar" onPress={() => navigation.navigate('Calendar')} variant="outline" />,
        <QuickAction key="slots" icon="⏰" label="Generate Slots" onPress={() => navigation.navigate('SlotGenerator')} variant="outline" />
      );
    }

    if (hasCoachAccess()) {
      actions.push(
        <QuickAction key="coaches" icon="👨‍🏫" label="Manage Coaches" onPress={() => navigation.navigate('Coaches')} />
      );
    }

    if (hasEcomAccess()) {
      actions.push(
        <QuickAction key="products" icon="📦" label="Products" onPress={() => navigation.navigate('Products')} />,
        <QuickAction key="orders" icon="🛒" label="Orders" onPress={() => navigation.navigate('Orders')} variant="outline" />
      );
    }

    return actions;
  };

  const renderServicesSection = () => {
    return (
      <>
        <QuickAction key="bookings" icon="📋" label="All Bookings" onPress={() => navigation.navigate('Bookings')} variant="outline" />
        <QuickAction key="memberships" icon="🎫" label="Memberships" onPress={() => navigation.navigate('Memberships')} variant="outline" />
        <QuickAction key="offers" icon="🎁" label="Offers" onPress={() => navigation.navigate('Offers')} variant="outline" />
        <QuickAction key="analytics" icon="📊" label="Analytics" onPress={() => navigation.navigate('Analytics')} />
        <QuickAction key="payouts" icon="💳" label="Payouts" onPress={() => navigation.navigate('Payouts')} />
      </>
    );
  };

  const containerStyle = [
    styles.container, 
    isWeb && isWideScreen && styles.webContainer
  ];

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={containerStyle}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[colors.primary]} 
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.breadcrumb}>GoAthlete / Dashboard</Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.bookButtonText}>New Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderStatusBanner()}
      
      {renderKPIs()}
      {renderSecondaryKPIs()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {renderQuickActions()}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services & Reports</Text>
        <View style={styles.quickActionsGrid}>
          {renderServicesSection()}
        </View>
      </View>

      {!loading && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewCard}>
            {hasVenueAccess() && (
              <>
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewLabel}>Total Venues</Text>
                  <Text style={styles.overviewValue}>{data?.total_venues || 0}</Text>
                </View>
                <View style={styles.overviewRow}>
                  <Text style={styles.overviewLabel}>Total Courts</Text>
                  <Text style={styles.overviewValue}>{data?.total_courts || 0}</Text>
                </View>
              </>
            )}
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Total Bookings</Text>
              <Text style={styles.overviewValue}>{data?.total_bookings || 0}</Text>
            </View>
            <View style={[styles.overviewRow, styles.overviewRowHighlight]}>
              <Text style={styles.overviewLabelHighlight}>This Week</Text>
              <Text style={styles.overviewValueHighlight}>
                {data?.week_bookings || 0} bookings
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  webContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: spacing.lg,
  },
  breadcrumb: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.headlineLarge,
    color: colors.primary,
  },
  bookButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.corner,
    backgroundColor: colors.accent,
    ...elevation.level1,
  },
  bookButtonText: {
    ...typography.label,
    fontWeight: '600',
    color: colors.onAccent,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: shape.corner,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    ...typography.body,
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  kpiCard: {
    width: '48%',
    margin: '1%',
    borderRadius: shape.cornerLarge,
    borderLeftWidth: 4,
    ...elevation.level1,
  },
  kpiCardHovered: {
    ...elevation.level2,
    transform: [{ translateY: -2 }],
  },
  kpiCardInner: {
    padding: spacing.md,
  },
  kpiLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    ...typography.display,
    fontSize: 28,
  },
  kpiSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionWrapper: {
    minWidth: 140,
    flexGrow: 1,
    flexBasis: '45%',
  },
  quickAction: {
    borderRadius: shape.corner,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...elevation.level1,
  },
  quickActionHovered: {
    ...elevation.level2,
  },
  quickActionOutlineHovered: {
    ...elevation.level1,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionText: {
    ...typography.label,
    flex: 1,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: shape.cornerLarge,
    padding: spacing.lg,
    ...elevation.level1,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider || colors.outlineVariant,
  },
  overviewRowHighlight: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0,
    borderRadius: shape.cornerSmall,
    marginTop: spacing.sm,
    marginBottom: -spacing.sm,
    backgroundColor: colors.cardHighlight || colors.surfaceVariant,
  },
  overviewLabel: {
    ...typography.body,
    color: colors.onSurfaceVariant,
  },
  overviewValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
  },
  overviewLabelHighlight: {
    ...typography.body,
    color: colors.onSurface,
  },
  overviewValueHighlight: {
    ...typography.titleMedium,
    color: colors.secondary,
  },
});
