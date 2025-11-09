import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth.tsx';
import type { Offer, OfferCategory, AppliedOffer } from '../types/offers.ts';

const useOffers = () => {
  const { user } = useAuth();
  const isNewUser = user?.createdAt ? 
    (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7 
    : false;

  const { data: offers } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const response = await fetch('API_URL/offers/available');
      return response.json();
    }
  });

  const { data: config } = useQuery({
    queryKey: ['offerConfig'],
    queryFn: async () => {
      const response = await fetch('API_URL/offers/config');
      return response.json();
    }
  });

  const filterOffers = (offers: Offer[], category?: OfferCategory) => {
    if (!offers || !config) return [];

    let filteredOffers = offers
      .filter(offer => offer.status === 'active')
      .filter(offer => {
        const now = new Date();
        return new Date(offer.validFrom) <= now && new Date(offer.validUntil) >= now;
      })
      .filter(offer => {
        if (offer.maxUsageCount) {
          return offer.currentUsageCount < offer.maxUsageCount;
        }
        return true;
      });

    // Filter by category if specified
    if (category) {
      filteredOffers = filteredOffers.filter(
        offer => offer.category === category || offer.category === 'all'
      );
    }

    // Show initial offers only to new users
    filteredOffers = filteredOffers.filter(
      offer => offer.type !== 'initial' || isNewUser
    );

    // Sort by priority and limit by config
    return filteredOffers
      .sort((a, b) => b.priority - a.priority)
      .slice(0, config.maxOffersToShow);
  };

  const isOfferValid = (offer: Offer, amount: number): boolean => {
    const now = new Date();
    return (
      offer.status === 'active' &&
      new Date(offer.validFrom) <= now &&
      new Date(offer.validUntil) >= now &&
      (!offer.maxUsageCount || offer.currentUsageCount < offer.maxUsageCount) &&
      (!offer.minBookingAmount || amount >= offer.minBookingAmount)
    );
  };

  const calculateDiscount = (offer: Offer, amount: number): number => {
    if (!isOfferValid(offer, amount)) return 0;

    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = (amount * offer.discountValue) / 100;
    } else {
      discount = offer.discountValue;
    }

    if (offer.maxDiscount) {
      discount = Math.min(discount, offer.maxDiscount);
    }

    return discount;
  };

  const getBestOffer = (offers: Offer[], amount: number): Offer | null => {
    const validOffers = offers.filter(offer => isOfferValid(offer, amount));
    if (validOffers.length === 0) return null;

    return validOffers.reduce((best, current) => {
      const bestDiscount = calculateDiscount(best, amount);
      const currentDiscount = calculateDiscount(current, amount);
      return currentDiscount > bestDiscount ? current : best;
    });
  };

  return {
    offers,
    config,
    filterOffers,
    isOfferValid,
    calculateDiscount,
    getBestOffer,
    isNewUser
  };
};

export default useOffers;