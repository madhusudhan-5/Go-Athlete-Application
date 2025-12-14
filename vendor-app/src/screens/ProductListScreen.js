import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { vendorService } from '../services/api';
import { useVendor } from '../context/VendorContext';

export default function ProductListScreen({ navigation }) {
  const { vendorId } = useVendor();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      const response = await vendorService.getProducts(vendorId);
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleActivate = async (productId) => {
    try {
      await vendorService.activateProduct(productId);
      loadProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to activate product');
    }
  };

  const handleDeactivate = async (productId) => {
    Alert.alert(
      'Deactivate Product',
      'This will hide the product from customers. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.deactivateProduct(productId);
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate product');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && p.is_active;
    if (filter === 'low_stock') return matchesSearch && p.is_low_stock;
    return matchesSearch;
  });

  const getCategoryColor = (category) => {
    const categoryColors = {
      EQUIPMENT: '#2196F3',
      APPAREL: '#9C27B0',
      ACCESSORIES: '#FF9800',
      NUTRITION: '#4CAF50',
      OTHER: '#607D8B',
    };
    return categoryColors[category] || colors.onSurfaceVariant;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.filterRow}>
        {['all', 'active', 'low_stock'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Low Stock'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptyText}>Add your first product to start selling</Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productTitleRow}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  {product.is_low_stock && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockText}>Low Stock</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
              </View>
              
              <View style={styles.productDetails}>
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Price</Text>
                  <View style={styles.priceRow}>
                    {product.discount_percentage > 0 && (
                      <Text style={styles.originalPrice}>₹{product.price}</Text>
                    )}
                    <Text style={styles.currentPrice}>
                      ₹{(product.price * (1 - product.discount_percentage / 100)).toFixed(0)}
                    </Text>
                    {product.discount_percentage > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount_percentage}% OFF</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.stockSection}>
                  <Text style={styles.stockLabel}>Stock</Text>
                  <Text style={[styles.stockValue, product.is_low_stock && { color: colors.error }]}>
                    {product.stock_quantity}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(product.category) + '20' }]}>
                  <Text style={[styles.categoryText, { color: getCategoryColor(product.category) }]}>
                    {product.category}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: product.is_active ? colors.success + '20' : colors.error + '20' }]}>
                  <Text style={{ color: product.is_active ? colors.success : colors.error, fontSize: 11, fontWeight: '600' }}>
                    {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditProduct', { product })}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('UpdateStock', { productId: product.id, productName: product.name, currentStock: product.stock_quantity })}
                >
                  <Text style={styles.actionBtnText}>Update Stock</Text>
                </TouchableOpacity>
                {product.is_active ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deactivateBtn]}
                    onPress={() => handleDeactivate(product.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.deactivateBtnText]}>Hide</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.activateBtn]}
                    onPress={() => handleActivate(product.id)}
                  >
                    <Text style={[styles.actionBtnText, styles.activateBtnText]}>Show</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
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
  searchBar: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyMedium,
    color: colors.onSurface,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
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
  },
  productCard: {
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
  productHeader: {
    marginBottom: spacing.sm,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productName: {
    ...typography.titleMedium,
    color: colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  productSku: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  lowStockBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: {
    ...typography.labelSmall,
    color: colors.error,
    fontWeight: '600',
  },
  productDetails: {
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
  stockSection: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  stockValue: {
    ...typography.titleMedium,
    color: colors.onSurface,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  categoryText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
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
