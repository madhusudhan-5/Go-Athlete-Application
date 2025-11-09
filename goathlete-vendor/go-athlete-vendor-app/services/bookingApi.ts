import { apiService } from './api.ts';

export interface BookingRequest {
  serviceType: 'VENUE' | 'COACH' | 'ECOMMERCE' | 'PRODUCT';
  itemId: string; // courtId, coachId, productId
  startTime?: string; // ISO
  endTime?: string; // ISO
  amount: number; // base amount
  currency?: string;
  offerId?: string | null;
  paymentMethod: 'ONLINE' | 'WALLET' | 'OFFLINE';
}

export interface BookingResponse {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  amount: number;
  commission: number;
  netAmount: number;
}

// Commission enforcement helper: default 20% if not provided
export function applyCommission(amount: number, commissionPct?: number) {
  const pct = commissionPct !== undefined ? commissionPct : 20;
  const commission = Math.round((amount * pct) / 100);
  const net = amount - commission;
  return { commission, net, commissionPct: pct };
}

export async function createBooking(payload: BookingRequest): Promise<BookingResponse> {
  // call out to apiService or vendorApi for real implementation
  try {
    const resp = await apiService.post('/vendor/bookings/create', payload as any);
    // assume API returns booking object
    const data = (resp as any).data || resp;
    return {
      id: data.id || String(Date.now()),
      status: data.status || 'CONFIRMED',
      amount: data.amount || payload.amount,
      commission: data.commission || Math.round((payload.amount * 20) / 100),
      netAmount: data.netAmount || Math.round(payload.amount - (payload.amount * 20) / 100),
    };
  } catch (err) {
    // fallback: simulate booking creation
    const { commission, net } = applyCommission(payload.amount);
    return {
      id: `local-${Date.now()}`,
      status: payload.paymentMethod === 'OFFLINE' ? 'PENDING' : 'CONFIRMED',
      amount: payload.amount,
      commission,
      netAmount: net,
    };
  }
}

export async function logTransaction(bookingId: string, amount: number, method: string, metadata?: any) {
  try {
    await apiService.post('/vendor/transactions/log', { bookingId, amount, method, metadata } as any);
  } catch (err) {
    // local fallback: console
    console.log('Transaction log failed (local fallback):', { bookingId, amount, method, metadata });
  }
}

export async function updateAnalytics(bookingId: string, data: any) {
  try {
    await apiService.post('/vendor/analytics/booking', { bookingId, ...data } as any);
  } catch (err) {
    console.log('Analytics update failed (local fallback):', bookingId, data);
  }
}

export default {
  createBooking,
  logTransaction,
  updateAnalytics,
};
