import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { vendorService } from '../services/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 200;

const AnalyticsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [analytics, setAnalytics] = useState({
    revenue: { total: 0, trend: [], change: 0 },
    bookings: { total: 0, completed: 0, cancelled: 0, pending: 0 },
    products: { totalSold: 0, revenue: 0, topProducts: [] },
    customers: { total: 0, returning: 0, new: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getAnalytics(period);
      if (data) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error.message);
      setAnalytics({
        revenue: { total: 0, trend: [0, 0, 0, 0, 0, 0, 0], change: 0 },
        bookings: { total: 0, completed: 0, cancelled: 0, pending: 0 },
        products: { totalSold: 0, revenue: 0, topProducts: [] },
        customers: { total: 0, returning: 0, new: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', analytics.revenue.total],
      ['Revenue Change', `${analytics.revenue.change}%`],
      ['Total Bookings', analytics.bookings.total],
      ['Completed Bookings', analytics.bookings.completed],
      ['Cancelled Bookings', analytics.bookings.cancelled],
      ['Pending Bookings', analytics.bookings.pending],
      ['Products Sold', analytics.products.totalSold],
      ['Product Revenue', analytics.products.revenue],
      ['Total Customers', analytics.customers.total],
      ['Returning Customers', analytics.customers.returning],
      ['New Customers', analytics.customers.new],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      console.log('CSV Export:', csvContent);
    }
  };

  const BarChart = ({ data, maxValue, color }) => {
    const max = maxValue || Math.max(...data, 1);
    const barWidth = (CHART_WIDTH - (data.length - 1) * 8) / data.length;

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { backgroundColor: colors.surfaceVariant }]}>
          {data.map((value, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: (value / max) * (CHART_HEIGHT - 40),
                  backgroundColor: color || colors.primary,
                  marginRight: index < data.length - 1 ? 8 : 0,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.chartLabels}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, data.length).map((label, i) => (
            <Text key={i} style={[styles.chartLabel, { color: colors.onSurfaceVariant, width: barWidth + 8 }]}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const DonutChart = ({ data, colors: chartColors, size = 120 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
    let currentAngle = 0;

    return (
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        <View style={[styles.donutOuter, { width: size, height: size, backgroundColor: colors.surfaceVariant }]}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360;
            const rotation = currentAngle;
            currentAngle += angle;
            return (
              <View
                key={index}
                style={[
                  styles.donutSegment,
                  {
                    width: size / 2,
                    height: size,
                    backgroundColor: chartColors[index],
                    transform: [
                      { translateX: size / 4 },
                      { rotate: `${rotation}deg` },
                      { translateX: -size / 4 },
                    ],
                    opacity: 0.9,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={[styles.donutInner, { width: size * 0.6, height: size * 0.6, backgroundColor: colors.surface }]}>
          <Text style={[styles.donutTotal, { color: colors.onSurface }]}>{total}</Text>
          <Text style={[styles.donutLabel, { color: colors.onSurfaceVariant }]}>Total</Text>
        </View>
      </View>
    );
  };

  const StatCard = ({ title, value, subtitle, trend, icon }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statHeader}>
        <Text style={[styles.statTitle, { color: colors.onSurfaceVariant }]}>{title}</Text>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.trendText, { color: trend >= 0 ? '#2E7D32' : '#C62828' }]}>
              {trend >= 0 ? '+' : ''}{trend}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color: colors.onSurface }]}>{value}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.onSurface,
    },
    exportBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    exportBtnText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    periodTabs: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
    },
    periodTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
    },
    periodTabActive: {
      backgroundColor: colors.primary,
    },
    periodTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    periodTabTextActive: {
      color: colors.onPrimary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    trendBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
    },
    statSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 16,
    },
    chartContainer: {
      alignItems: 'center',
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: CHART_HEIGHT - 40,
      paddingHorizontal: 8,
      paddingBottom: 8,
      borderRadius: 8,
    },
    bar: {
      borderRadius: 4,
      minHeight: 4,
    },
    chartLabels: {
      flexDirection: 'row',
      marginTop: 8,
    },
    chartLabel: {
      fontSize: 10,
      textAlign: 'center',
    },
    donutContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutOuter: {
      borderRadius: 60,
      overflow: 'hidden',
      position: 'relative',
    },
    donutSegment: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    donutInner: {
      position: 'absolute',
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutTotal: {
      fontSize: 20,
      fontWeight: '700',
    },
    donutLabel: {
      fontSize: 10,
    },
    bookingsChart: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    legendContainer: {
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendLabel: {
      fontSize: 14,
      color: colors.onSurface,
    },
    legendValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    topProductsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    productName: {
      fontSize: 14,
      color: colors.onSurface,
      flex: 1,
    },
    productStats: {
      flexDirection: 'row',
      gap: 16,
    },
    productStat: {
      alignItems: 'flex-end',
    },
    productStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    productStatLabel: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.onSurfaceVariant, marginTop: 16 }}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodTabs}>
        {['week', 'month', 'year'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Revenue"
              value={`₹${analytics.revenue.total.toLocaleString()}`}
              trend={analytics.revenue.change}
            />
            <StatCard
              title="Bookings"
              value={analytics.bookings.total}
              subtitle={`${analytics.bookings.completed} completed`}
            />
            <StatCard
              title="Products Sold"
              value={analytics.products.totalSold}
              subtitle={`₹${analytics.products.revenue.toLocaleString()}`}
            />
            <StatCard
              title="Customers"
              value={analytics.customers.total}
              subtitle={`${analytics.customers.new} new`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <BarChart data={analytics.revenue.trend} color={colors.primary} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Booking Status</Text>
            <View style={styles.bookingsChart}>
              <DonutChart
                data={[
                  { label: 'Completed', value: analytics.bookings.completed },
                  { label: 'Pending', value: analytics.bookings.pending },
                  { label: 'Cancelled', value: analytics.bookings.cancelled },
                ]}
                colors={['#4CAF50', '#FF9800', '#F44336']}
              />
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendLabel}>Completed</Text>
                  <Text style={styles.legendValue}>{analytics.bookings.completed}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.legendLabel}>Pending</Text>
                  <Text style={styles.legendValue}>{analytics.bookings.pending}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.legendLabel}>Cancelled</Text>
                  <Text style={styles.legendValue}>{analytics.bookings.cancelled}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.topProductsCard}>
            <Text style={styles.chartTitle}>Top Products</Text>
            {analytics.products.topProducts.map((product, index) => (
              <View key={index} style={[styles.productRow, index === analytics.products.topProducts.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productStats}>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatValue}>{product.sold}</Text>
                    <Text style={styles.productStatLabel}>Sold</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatValue}>₹{product.revenue.toLocaleString()}</Text>
                    <Text style={styles.productStatLabel}>Revenue</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AnalyticsScreen;
