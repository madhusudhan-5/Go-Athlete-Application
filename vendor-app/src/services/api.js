import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await AsyncStorage.setItem('access_token', access);

        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        processQueue(null, access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        await AsyncStorage.multiRemove([
          'access_token',
          'refresh_token',
          'vendor_id',
          'vendor_type',
          'vendor_status',
        ]);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    await AsyncStorage.setItem('access_token', response.data.access);
    await AsyncStorage.setItem('refresh_token', response.data.refresh);
    if (response.data.vendor) {
      await AsyncStorage.setItem('vendor_id', response.data.vendor.id.toString());
      await AsyncStorage.setItem('vendor_type', response.data.vendor.vendor_type);
      await AsyncStorage.setItem('vendor_status', response.data.vendor.status);
    }
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/auth/register/', data);
    await AsyncStorage.setItem('access_token', response.data.access);
    await AsyncStorage.setItem('refresh_token', response.data.refresh);
    if (response.data.vendor) {
      await AsyncStorage.setItem('vendor_id', response.data.vendor.id.toString());
      await AsyncStorage.setItem('vendor_type', response.data.vendor.vendor_type);
      await AsyncStorage.setItem('vendor_status', response.data.vendor.status);
    }
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token',
      'vendor_id',
      'vendor_type',
      'vendor_status',
    ]);
  },
  getToken: async () => {
    return await AsyncStorage.getItem('access_token');
  },
  getVendorId: async () => {
    const id = await AsyncStorage.getItem('vendor_id');
    return id ? parseInt(id) : null;
  },
  getVendorType: async () => {
    return await AsyncStorage.getItem('vendor_type');
  },
  getVendorStatus: async () => {
    return await AsyncStorage.getItem('vendor_status');
  },
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
  checkStatus: async () => {
    const vendorId = await AsyncStorage.getItem('vendor_id');
    if (!vendorId) {
      throw new Error('No vendor ID found');
    }
    const response = await api.get(`/vendors/${vendorId}/`);
    if (response.data) {
      await AsyncStorage.setItem('vendor_status', response.data.status);
    }
    return { vendor: response.data };
  },
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${API_BASE}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
    
    const { access } = response.data;
    await AsyncStorage.setItem('access_token', access);
    return access;
  },
};

export const vendorService = {
  getDashboard: (vendorId) => api.get(`/vendor/dashboard/?vendor_id=${vendorId}`),
  
  getVenues: (vendorId) => api.get(`/venues/?vendor=${vendorId}`),
  getVenue: (id) => api.get(`/venues/${id}/`),
  createVenue: (data) => api.post('/venues/', data),
  updateVenue: (id, data) => api.patch(`/venues/${id}/`, data),
  deleteVenue: (id) => api.delete(`/venues/${id}/`),
  activateVenue: (id) => api.post(`/venues/${id}/activate/`),
  deactivateVenue: (id) => api.post(`/venues/${id}/deactivate/`),
  
  getCourts: (vendorId) => api.get(`/courts/?vendor=${vendorId}`),
  getCourtsByVenue: (venueId) => api.get(`/courts/?venue=${venueId}`),
  getCourt: (id) => api.get(`/courts/${id}/`),
  createCourt: (data) => api.post('/courts/', data),
  updateCourt: (id, data) => api.patch(`/courts/${id}/`, data),
  deleteCourt: (id) => api.delete(`/courts/${id}/`),
  activateCourt: (id) => api.post(`/courts/${id}/activate/`),
  deactivateCourt: (id) => api.post(`/courts/${id}/deactivate/`),
  
  generateSlots: (courtId, date) => api.get(`/vendor/slots/?court_id=${courtId}&date=${date}`),
  generateSlotsRange: (data) => api.post('/vendor/slots/', data),
  saveSlots: (data) => api.post('/vendor/slots/', { ...data, save: true }),
  
  getBookings: (vendorId, date, status) => {
    let url = `/bookings/?vendor=${vendorId}`;
    if (date) url += `&date=${date}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  getBooking: (id) => api.get(`/bookings/${id}/`),
  createBooking: (data) => api.post('/vendor/create-booking/', data),
  cancelBooking: (bookingId) => api.post(`/bookings/${bookingId}/cancel/`),
  completeBooking: (bookingId) => api.post(`/bookings/${bookingId}/complete/`),
  refundBooking: (bookingId) => api.post(`/bookings/${bookingId}/refund/`),
  rescheduleBooking: (bookingId, data) => api.post(`/bookings/${bookingId}/reschedule/`, data),
  
  getOffers: (vendorId) => api.get(`/vendor/offers/?vendor=${vendorId}`),
  getOffer: (id) => api.get(`/vendor/offers/${id}/`),
  createOffer: (data) => api.post('/vendor/offers/', data),
  updateOffer: (id, data) => api.patch(`/vendor/offers/${id}/`, data),
  deleteOffer: (id) => api.delete(`/vendor/offers/${id}/`),
  activateOffer: (id) => api.post(`/vendor/offers/${id}/activate/`),
  deactivateOffer: (id) => api.post(`/vendor/offers/${id}/deactivate/`),
  
  getCoaches: (vendorId) => api.get(`/vendor/coaches/?vendor=${vendorId}`),
  getCoach: (id) => api.get(`/vendor/coaches/${id}/`),
  createCoach: (data) => api.post('/vendor/coaches/', data),
  updateCoach: (id, data) => api.patch(`/vendor/coaches/${id}/`, data),
  deleteCoach: (id) => api.delete(`/vendor/coaches/${id}/`),
  activateCoach: (id) => api.post(`/vendor/coaches/${id}/activate/`),
  deactivateCoach: (id) => api.post(`/vendor/coaches/${id}/deactivate/`),
  
  getCoachSessions: (coachId) => api.get(`/vendor/coaching-sessions/?coach=${coachId}`),
  getCoachingSession: (id) => api.get(`/vendor/coaching-sessions/${id}/`),
  createCoachingSession: (data) => api.post('/vendor/coaching-sessions/', data),
  confirmSession: (id) => api.post(`/vendor/coaching-sessions/${id}/confirm/`),
  completeSession: (id) => api.post(`/vendor/coaching-sessions/${id}/complete/`),
  cancelSession: (id) => api.post(`/vendor/coaching-sessions/${id}/cancel/`),
  
  getProducts: (vendorId) => api.get(`/vendor/products/?vendor=${vendorId}`),
  getProduct: (id) => api.get(`/vendor/products/${id}/`),
  createProduct: (data) => api.post('/vendor/products/', data),
  updateProduct: (id, data) => api.patch(`/vendor/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}/`),
  activateProduct: (id) => api.post(`/vendor/products/${id}/activate/`),
  deactivateProduct: (id) => api.post(`/vendor/products/${id}/deactivate/`),
  updateStock: (id, quantity) => api.post(`/vendor/products/${id}/update-stock/`, { quantity }),
  
  getOrders: (vendorId) => api.get(`/vendor/orders/?vendor=${vendorId}`),
  getOrder: (id) => api.get(`/vendor/orders/${id}/`),
  confirmOrder: (id) => api.post(`/vendor/orders/${id}/confirm/`),
  shipOrder: (id, data) => api.post(`/vendor/orders/${id}/ship/`, data),
  deliverOrder: (id) => api.post(`/vendor/orders/${id}/deliver/`),
  cancelOrder: (id) => api.post(`/vendor/orders/${id}/cancel/`),
  
  getMemberships: (vendorId) => api.get(`/vendor/memberships/?vendor=${vendorId}`),
  getMembership: (id) => api.get(`/vendor/memberships/${id}/`),
  createMembership: (data) => api.post('/vendor/memberships/', data),
  updateMembership: (id, data) => api.patch(`/vendor/memberships/${id}/`, data),
  deleteMembership: (id) => api.delete(`/vendor/memberships/${id}/`),
  activateMembership: (id) => api.post(`/vendor/memberships/${id}/activate/`),
  deactivateMembership: (id) => api.post(`/vendor/memberships/${id}/deactivate/`),
  
  getCustomerMemberships: (membershipId) => api.get(`/vendor/customer-memberships/?membership=${membershipId}`),
  pauseCustomerMembership: (id) => api.post(`/vendor/customer-memberships/${id}/pause/`),
  resumeCustomerMembership: (id) => api.post(`/vendor/customer-memberships/${id}/resume/`),
  cancelCustomerMembership: (id) => api.post(`/vendor/customer-memberships/${id}/cancel/`),
  
  getPayoutSummary: (vendorId) => api.get(`/vendor/payout-summary/?vendor_id=${vendorId}`),
  requestPayout: (vendorId) => api.post('/vendor/request-payout/', { vendor_id: vendorId }),
  
  getSettings: () => api.get('/vendor/settings/'),
  updateSettings: (data) => api.patch('/vendor/settings/', data),
  
  getGlobalConfig: () => api.get('/global-config/'),
  
  sendSMS: (to, message) => api.post('/send-sms/', { to, message }),

  getAnalytics: async (period = 'week') => {
    const vendorId = await AsyncStorage.getItem('vendor_id');
    if (!vendorId) {
      throw new Error('No vendor ID found');
    }
    const response = await api.get(`/vendor/analytics/?vendor_id=${vendorId}&period=${period}`);
    return response.data;
  },

  registerPushToken: (vendorId, pushToken, platform) => 
    api.post('/vendor/push-token/', { vendor_id: vendorId, push_token: pushToken, platform }),

  uploadFile: (formData) => api.post('/vendor/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
