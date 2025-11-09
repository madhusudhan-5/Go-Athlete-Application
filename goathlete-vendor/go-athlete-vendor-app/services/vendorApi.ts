import axios from 'axios';
import { API_BASE_URL } from '../config/index.ts';

const BASE_URL = API_BASE_URL || 'http://localhost:8000/api/v1';

// Types
export interface DashboardStats {
  todayBookings: number;
  tomorrowBookings: number;
  totalEarnings: number;
  activeOffers: number;
  recentBookings: Booking[];
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  baseAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  commissionAmount?: number;
  totalAmount?: number;
  payoutAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface Court {
  id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  hourlyRate: number;
  slots: TimeSlot[];
  status: 'active' | 'maintenance' | 'inactive';
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  courtIds: string[];
  status: 'active' | 'expired' | 'draft';
}

const vendorApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/dashboard/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Venues
  getVenues: async (): Promise<any[]> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/venues/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  createVenue: async (venueData: any): Promise<any> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/venues/`, venueData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Courts
  getCourts: async (venueId?: string): Promise<Court[]> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const url = venueId 
      ? `${BASE_URL}/vendor/courts/?venue_id=${venueId}`
      : `${BASE_URL}/vendor/courts/`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  createCourt: async (courtData: Omit<Court, 'id'>): Promise<Court> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/courts/`, courtData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateCourt: async (id: string, courtData: Partial<Court>): Promise<Court> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.put(`${BASE_URL}/vendor/courts/${id}/`, courtData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteCourt: async (id: string): Promise<void> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    await axios.delete(`${BASE_URL}/vendor/courts/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  setCourtAvailability: async (courtId: string, availabilities: any[]): Promise<any> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/courts/${courtId}/availability/`, {
      availabilities
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  generateTimeSlots: async (courtId: string, data: {
    date: string;
    slot_duration_minutes: number;
    start_time: string;
    end_time: string;
  }): Promise<any> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/courts/${courtId}/slots/generate/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Bookings
  getBookings: async (params?: { 
    date?: string;
    status?: string;
    court_id?: string;
    payment_status?: string;
    page?: number;
  }): Promise<any> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/bookings/`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/bookings/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createBooking: async (bookingData: any): Promise<Booking> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/bookings/`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  rescheduleBooking: async (id: string, newDate: string, newTime: string): Promise<Booking> => {
    const [startTime, endTime] = newTime.split('-');
    const data = {
      new_date: newDate,
      new_start_time: startTime.trim(),
      new_end_time: endTime.trim()
    };
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.put(`${BASE_URL}/vendor/bookings/${id}/reschedule/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.post(`${BASE_URL}/vendor/bookings/${id}/cancel/`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Offers
  getOffers: async (isActive?: boolean): Promise<Offer[]> => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await axios.get(`${BASE_URL}/vendor/offers/`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.results || response.data;
  },

  createOffer: async (offerData: Omit<Offer, 'id'>): Promise<Offer> => {
    const response = await axios.post(`${API_BASE_URL}/vendor/offers`, offerData);
    return response.data;
  },

  updateOffer: async (id: string, offerData: Partial<Offer>): Promise<Offer> => {
    const response = await axios.put(`${API_BASE_URL}/vendor/offers/${id}`, offerData);
    return response.data;
  },

  deleteOffer: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/vendor/offers/${id}`);
  },

  // Analytics
  getBookingAnalytics: async (params: {
    start_date: string;
    end_date: string;
    groupby: 'daily' | 'weekly' | 'monthly';
    metric?: 'bookings';
  }) => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/analytics/`, {
      params: { ...params, metric: params.metric || 'bookings' },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getRevenueAnalytics: async (params: {
    start_date: string;
    end_date: string;
    groupby: 'daily' | 'weekly' | 'monthly';
    metric?: 'revenue';
  }) => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/analytics/`, {
      params: { ...params, metric: params.metric || 'revenue' },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Financial
  getFinancialSummary: async (params?: {
    start_date?: string;
    end_date?: string;
    period?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  }) => {
    const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('auth_token');
    const response = await axios.get(`${BASE_URL}/vendor/financial/summary/`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default vendorApi;