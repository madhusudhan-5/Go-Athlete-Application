import axios from 'axios';

const API_BASE_URL = 'https://api.goathlete.in/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('admin_access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          window.location.href = '/admin/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/admin/auth/login/', { email, password });
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await api.post('/admin/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/admin/auth/me/');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/admin/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/admin/dashboard/summary/');
    return response.data;
  },
};

export const vendorService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/vendors/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/vendors/${id}/`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/admin/vendors/${id}/approve/`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.post(`/admin/vendors/${id}/reject/`, { reason });
    return response.data;
  },

  suspend: async (id, reason) => {
    const response = await api.post(`/admin/vendors/${id}/suspend/`, { reason });
    return response.data;
  },

  activate: async (id) => {
    const response = await api.post(`/admin/vendors/${id}/activate/`);
    return response.data;
  },
};

export const kycService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/kyc/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/kyc/${id}/`);
    return response.data;
  },

  verify: async (id) => {
    const response = await api.post(`/admin/kyc/${id}/verify/`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.post(`/admin/kyc/${id}/reject/`, { reason });
    return response.data;
  },
};

export const bookingService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/bookings/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/bookings/${id}/`);
    return response.data;
  },

  updateStatus: async (id, status, reason = null) => {
    const response = await api.patch(`/admin/bookings/${id}/`, { status, reason });
    return response.data;
  },

  refund: async (id, amount, reason) => {
    const response = await api.post(`/admin/bookings/${id}/refund/`, { amount, reason });
    return response.data;
  },
};

export const commissionService = {
  getConfig: async () => {
    const response = await api.get('/admin/commission-config/');
    return response.data;
  },

  updateConfig: async (config) => {
    const response = await api.patch('/admin/commission-config/', config);
    return response.data;
  },
};

export const offerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/offers/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/offers/${id}/`);
    return response.data;
  },

  create: async (offer) => {
    const response = await api.post('/admin/offers/', offer);
    return response.data;
  },

  update: async (id, offer) => {
    const response = await api.patch(`/admin/offers/${id}/`, offer);
    return response.data;
  },

  activate: async (id) => {
    const response = await api.post(`/admin/offers/${id}/activate/`);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await api.post(`/admin/offers/${id}/deactivate/`);
    return response.data;
  },
};

export const membershipService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/memberships/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/memberships/${id}/`);
    return response.data;
  },
};

export const payoutService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/payouts/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/payouts/${id}/`);
    return response.data;
  },

  markProcessing: async (id) => {
    const response = await api.post(`/admin/payouts/${id}/mark-processing/`);
    return response.data;
  },

  markPaid: async (id, referenceId) => {
    const response = await api.post(`/admin/payouts/${id}/mark-paid/`, {
      reference_id: referenceId,
    });
    return response.data;
  },

  markFailed: async (id, reason) => {
    const response = await api.post(`/admin/payouts/${id}/mark-failed/`, { reason });
    return response.data;
  },
};

export const ticketService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/tickets/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/tickets/${id}/`);
    return response.data;
  },

  assign: async (id, adminId) => {
    const response = await api.post(`/admin/tickets/${id}/assign/`, { admin_id: adminId });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.post(`/admin/tickets/${id}/update-status/`, { status });
    return response.data;
  },

  addNote: async (id, text) => {
    const response = await api.post(`/admin/tickets/${id}/add-note/`, { text });
    return response.data;
  },
};

export const analyticsService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/admin/reports/summary/', { params });
    return response.data;
  },

  getTopVendors: async (params = {}) => {
    const response = await api.get('/admin/reports/vendors-top/', { params });
    return response.data;
  },

  getTopProducts: async (params = {}) => {
    const response = await api.get('/admin/reports/products-top/', { params });
    return response.data;
  },

  exportCSV: async (params = {}) => {
    const response = await api.get('/admin/reports/export/', {
      params: { ...params, type: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },
};

export const searchService = {
  globalSearch: async (query) => {
    const response = await api.get('/admin/search/', { params: { q: query } });
    return response.data;
  },
};

export default api;
