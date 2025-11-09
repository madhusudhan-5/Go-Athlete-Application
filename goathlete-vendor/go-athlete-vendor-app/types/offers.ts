export type OfferType = 'initial' | 'festive' | 'category' | 'seasonal';
export type OfferCategory = 'venue' | 'coach' | 'ecommerce' | 'all';
export type RedemptionType = 'auto' | 'code' | 'tap';

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: OfferType;
  category: OfferCategory;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  redemptionType: RedemptionType;
  code?: string;
  maxUsageCount?: number;
  currentUsageCount: number;
  minBookingAmount?: number;
  maxDiscount?: number;
  termsAndConditions: string[];
  createdBy: {
    id: string;
    name: string;
    role: 'admin' | 'superadmin';
  };
  status: 'active' | 'expired' | 'upcoming';
  priority: number;
}

export interface AppliedOffer {
  offerId: string;
  discountAmount: number;
  appliedBy: {
    id: string;
    name: string;
    role: string;
  };
  appliedAt: string;
}

export interface OfferDisplayConfig {
  maxOffersToShow: number;
  priorityThreshold: number;
  categories: {
    [key in OfferCategory]: {
      enabled: boolean;
      maxOffers: number;
    };
  };
}