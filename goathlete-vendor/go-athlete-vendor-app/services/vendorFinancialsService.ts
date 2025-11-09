import { apiService } from './api.ts';

export interface VendorFinancials {
  balance: number;
  totalProfit: number;
  todayEarnings: number;
  pendingPayouts: number;
  monthlyStats: {
    totalBookings: number;
    totalEarnings: number;
    totalCommission: number;
    averageRating: number;
  };
  recentTransactions: {
    id: string;
    amount: number;
    commission: number;
    netAmount: number;
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    paymentMethod: 'ONLINE' | 'OFFLINE';
    customerName: string;
    createdAt: string;
    serviceType: string;
  }[];
}

class VendorFinancialsService {
  async getFinancials(): Promise<VendorFinancials> {
    try {
      const { data } = await apiService.get('/vendor/financials');
      return data;
    } catch (error) {
      console.error('Failed to fetch vendor financials:', error);
      throw new Error('Unable to fetch financials');
    }
  }

  async getTransactionHistory(params?: {
    startDate?: string;
    endDate?: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED';
    page?: number;
    limit?: number;
  }) {
    try {
      const { data } = await apiService.get('/vendor/transactions', { params });
      return data;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw new Error('Unable to fetch transactions');
    }
  }

  async getEarningsAnalytics(timeframe: 'day' | 'week' | 'month' | 'year') {
    try {
      const { data } = await apiService.get(`/vendor/analytics/earnings/${timeframe}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch earnings analytics:', error);
      throw new Error('Unable to fetch earnings analytics');
    }
  }
}

export const vendorFinancialsService = new VendorFinancialsService();