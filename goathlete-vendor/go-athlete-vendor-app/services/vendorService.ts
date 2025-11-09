import { apiService } from './api.ts';

export interface VendorTransaction {
  id: string;
  amount: number;
  commission: number;
  netAmount: number;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  paymentMethod: 'ONLINE' | 'OFFLINE';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface VendorStats {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalCommission: number;
  netEarnings: number;
  pendingPayouts: number;
}

export interface VendorFinancials {
  currentBalance: number;
  todayEarnings: number;
  monthlyStats: VendorStats;
  recentTransactions: VendorTransaction[];
}

class VendorService {
  async getFinancials(): Promise<VendorFinancials> {
    const { data } = await apiService.get('/vendor/financials');
    return data;
  }

  async getTransactions(params: {
    startDate?: string;
    endDate?: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  }): Promise<VendorTransaction[]> {
    const queryString = new URLSearchParams(params as any).toString();
    const { data } = await apiService.get(`/vendor/transactions?${queryString}`);
    return data;
  }

  async getStats(period: 'day' | 'week' | 'month' | 'year'): Promise<VendorStats> {
    const { data } = await apiService.get(`/vendor/stats/${period}`);
    return data;
  }
}

export const vendorService = new VendorService();