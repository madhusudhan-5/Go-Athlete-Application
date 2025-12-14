import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useVendor } from '../context/VendorContext';
import { vendorService } from '../services/api';
import debounce from 'lodash/debounce';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'venues', label: 'Venues' },
  { id: 'courts', label: 'Courts' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'products', label: 'Products' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'orders', label: 'Orders' },
];

const SearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { vendorId } = useVendor();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async (searchQuery, searchCategory) => {
    if (!searchQuery.trim() || !vendorId) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const searchResults = [];
      const q = searchQuery.toLowerCase();

      if (searchCategory === 'all' || searchCategory === 'venues') {
        try {
          const response = await vendorService.getVenues(vendorId);
          const venues = response.data || response || [];
          const filtered = (Array.isArray(venues) ? venues : []).filter(v => 
            v.name?.toLowerCase().includes(q) || 
            v.address?.toLowerCase().includes(q)
          );
          filtered.forEach(v => searchResults.push({ ...v, type: 'venue', title: v.name, subtitle: v.address }));
        } catch (e) { console.log('Venues search error:', e); }
      }

      if (searchCategory === 'all' || searchCategory === 'courts') {
        try {
          const response = await vendorService.getCourts(vendorId);
          const courts = response.data || response || [];
          const filtered = (Array.isArray(courts) ? courts : []).filter(c => 
            c.name?.toLowerCase().includes(q) || 
            c.sport_type?.toLowerCase().includes(q)
          );
          filtered.forEach(c => searchResults.push({ ...c, type: 'court', title: c.name, subtitle: c.sport_type }));
        } catch (e) { console.log('Courts search error:', e); }
      }

      if (searchCategory === 'all' || searchCategory === 'coaches') {
        try {
          const response = await vendorService.getCoaches(vendorId);
          const coaches = response.data || response || [];
          const filtered = (Array.isArray(coaches) ? coaches : []).filter(c => 
            c.name?.toLowerCase().includes(q) || 
            c.specialization?.toLowerCase().includes(q)
          );
          filtered.forEach(c => searchResults.push({ ...c, type: 'coach', title: c.name, subtitle: c.specialization }));
        } catch (e) { console.log('Coaches search error:', e); }
      }

      if (searchCategory === 'all' || searchCategory === 'products') {
        try {
          const response = await vendorService.getProducts(vendorId);
          const products = response.data || response || [];
          const filtered = (Array.isArray(products) ? products : []).filter(p => 
            p.name?.toLowerCase().includes(q) || 
            p.category?.toLowerCase().includes(q)
          );
          filtered.forEach(p => searchResults.push({ ...p, type: 'product', title: p.name, subtitle: `₹${p.price}` }));
        } catch (e) { console.log('Products search error:', e); }
      }

      if (searchCategory === 'all' || searchCategory === 'bookings') {
        try {
          const response = await vendorService.getBookings(vendorId);
          const bookings = response.data || response || [];
          const filtered = (Array.isArray(bookings) ? bookings : []).filter(b => 
            b.customer_name?.toLowerCase().includes(q) || 
            b.court_name?.toLowerCase().includes(q) ||
            b.id?.toString().includes(q)
          );
          filtered.forEach(b => searchResults.push({ ...b, type: 'booking', title: `Booking #${b.id}`, subtitle: b.customer_name }));
        } catch (e) { console.log('Bookings search error:', e); }
      }

      if (searchCategory === 'all' || searchCategory === 'orders') {
        try {
          const response = await vendorService.getOrders(vendorId);
          const orders = response.data || response || [];
          const filtered = (Array.isArray(orders) ? orders : []).filter(o => 
            o.customer_name?.toLowerCase().includes(q) || 
            o.id?.toString().includes(q)
          );
          filtered.forEach(o => searchResults.push({ ...o, type: 'order', title: `Order #${o.id}`, subtitle: o.customer_name }));
        } catch (e) { console.log('Orders search error:', e); }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((q, c) => performSearch(q, c), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query, category);
    return () => debouncedSearch.cancel();
  }, [query, category]);

  const handleResultPress = (item) => {
    Keyboard.dismiss();
    switch (item.type) {
      case 'venue':
        navigation.navigate('EditVenue', { venue: item });
        break;
      case 'court':
        navigation.navigate('EditCourt', { court: item });
        break;
      case 'coach':
        navigation.navigate('EditCoach', { coach: item });
        break;
      case 'product':
        navigation.navigate('EditProduct', { product: item });
        break;
      case 'booking':
        navigation.navigate('BookingDetail', { booking: item });
        break;
      case 'order':
        navigation.navigate('Orders');
        break;
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      venue: '🏟️',
      court: '🎾',
      coach: '👨‍🏫',
      product: '📦',
      booking: '📅',
      order: '🛒',
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const typeColors = {
      venue: '#4CAF50',
      court: '#2196F3',
      coach: '#FF9800',
      product: '#9C27B0',
      booking: '#00BCD4',
      order: '#E91E63',
    };
    return typeColors[type] || colors.primary;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    searchIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: colors.onSurface,
    },
    clearBtn: {
      padding: 8,
    },
    clearBtnText: {
      fontSize: 18,
      color: colors.onSurfaceVariant,
    },
    categoriesContainer: {
      paddingVertical: 12,
    },
    categoriesScroll: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    categoryChipTextActive: {
      color: colors.onPrimary,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
    },
    resultsList: {
      padding: 16,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    resultIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    resultIcon: {
      fontSize: 24,
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    resultSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    resultType: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    resultTypeText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    resultsCount: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surfaceVariant,
    },
    resultsCountText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });

  const renderResultItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(item)}>
      <View style={[styles.resultIconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
        <Text style={styles.resultIcon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle && <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
      </View>
      <View style={[styles.resultType, { backgroundColor: getTypeColor(item.type) + '20' }]}>
        <Text style={[styles.resultTypeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, courts, products..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.categoriesContainer}>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, category === item.id && styles.categoryChipActive]}
                onPress={() => setCategory(item.id)}
              >
                <Text style={[styles.categoryChipText, category === item.id && styles.categoryChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 16 }}>Searching...</Text>
          </View>
        ) : !searched ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Start typing to search</Text>
            <Text style={styles.emptySubtext}>
              Search across venues, courts, coaches, products, bookings, and orders
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>😕</Text>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </Text>
            </View>
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
              renderItem={renderResultItem}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
};

export default SearchScreen;
