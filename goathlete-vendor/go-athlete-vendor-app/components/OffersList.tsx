import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import useOffers from '../hooks/useOffers.ts';
import type { Offer, OfferCategory } from '../types/offers.ts';

interface OffersListProps {
  category?: OfferCategory;
  amount?: number;
  onSelectOffer?: (offer: Offer) => void;
}

export const OffersList: React.FC<OffersListProps> = ({
  category,
  amount,
  onSelectOffer
}) => {
  const { offers, filterOffers, calculateDiscount } = useOffers();
  const filteredOffers = filterOffers(offers || [], category);

  const renderOffer = ({ item: offer }: { item: Offer }) => {
    const discount = amount ? calculateDiscount(offer, amount) : null;

    return (
      <Pressable 
        style={styles.offerCard}
        onPress={() => onSelectOffer?.(offer)}
      >
        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          {offer.type === 'initial' && (
            <Text style={styles.newUserBadge}>New User</Text>
          )}
        </View>
        
        <Text style={styles.description}>{offer.description}</Text>
        
        <View style={styles.discountInfo}>
          {offer.discountType === 'percentage' ? (
            <Text style={styles.discountValue}>{offer.discountValue}% OFF</Text>
          ) : (
            <Text style={styles.discountValue}>₹{offer.discountValue} OFF</Text>
          )}
          {discount && (
            <Text style={styles.estimatedDiscount}>
              Estimated savings: ₹{discount.toFixed(2)}
            </Text>
          )}
        </View>

        {offer.maxDiscount && (
          <Text style={styles.maxDiscount}>
            Up to ₹{offer.maxDiscount}
          </Text>
        )}

        <View style={styles.footer}>
          {offer.minBookingAmount && (
            <Text style={styles.condition}>
              Min. booking: ₹{offer.minBookingAmount}
            </Text>
          )}
          <Text style={styles.validity}>
            Valid till {new Date(offer.validUntil).toLocaleDateString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (!filteredOffers.length) {
    return (
      <View style={styles.noOffers}>
        <Text style={styles.noOffersText}>No offers available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredOffers}
      renderItem={renderOffer}
      keyExtractor={(offer) => offer.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  newUserBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  discountInfo: {
    marginBottom: 8,
  },
  discountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 4,
  },
  estimatedDiscount: {
    fontSize: 14,
    color: '#4CAF50',
  },
  maxDiscount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  condition: {
    fontSize: 12,
    color: '#666',
  },
  validity: {
    fontSize: 12,
    color: '#666',
  },
  noOffers: {
    padding: 16,
    alignItems: 'center',
  },
  noOffersText: {
    fontSize: 16,
    color: '#666',
  },
});

export default OffersList;