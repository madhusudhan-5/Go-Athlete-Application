import axios from 'axios';

const API_BASE = 'https://api.goathlete.in/api';

const superApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

superApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('super_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('super_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE}/super/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('super_access_token', newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return superApi(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('super_access_token');
          localStorage.removeItem('super_refresh_token');
          window.location.href = '/super/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const superAuthService = {
  login: async (email, password) => {
    const response = await superApi.post('/super/auth/login/', { email, password });
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await axios.post(`${API_BASE}/super/auth/refresh/`, { refresh: refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await superApi.get('/super/auth/me/');
    return response.data;
  },
};

export const superAdminService = {
  getAdmins: async () => {
    const response = await superApi.get('/super/admins/');
    return response.data;
  },

  getAdmin: async (id) => {
    const response = await superApi.get(`/super/admins/${id}/`);
    return response.data;
  },

  createAdmin: async (data) => {
    const response = await superApi.post('/super/admins/', data);
    return response.data;
  },

  updateAdmin: async (id, data) => {
    const response = await superApi.patch(`/super/admins/${id}/`, data);
    return response.data;
  },

  enableAdmin: async (id) => {
    const response = await superApi.post(`/super/admins/${id}/enable/`);
    return response.data;
  },

  disableAdmin: async (id) => {
    const response = await superApi.post(`/super/admins/${id}/disable/`);
    return response.data;
  },
};

export const systemConfigService = {
  getConfig: async () => {
    const response = await superApi.get('/super/config/');
    return response.data;
  },

  updateConfig: async (data) => {
    const response = await superApi.patch('/super/config/', data);
    return response.data;
  },
};

export const commissionService = {
  getHistory: async () => {
    const response = await superApi.get('/super/commissions/history/');
    return response.data;
  },

  override: async (data) => {
    const response = await superApi.post('/super/commissions/override/', data);
    return response.data;
  },
};

export const analyticsService = {
  getSummary: async (params = {}) => {
    const response = await superApi.get('/super/analytics/summary/', { params });
    return response.data;
  },
};

export const broadcastService = {
  getAll: async (target) => {
    const params = target ? { target } : {};
    const response = await superApi.get('/super/broadcast/', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await superApi.post('/super/broadcast/', data);
    return response.data;
  },
};

export const offerService = {
  getAll: async () => {
    const response = await superApi.get('/super/offers/');
    return response.data;
  },

  override: async (id, data) => {
    const response = await superApi.post(`/super/offers/${id}/override/`, data);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await superApi.post(`/super/offers/${id}/deactivate/`);
    return response.data;
  },

  delete: async (id) => {
    const response = await superApi.delete(`/super/offers/${id}/`);
    return response.data;
  },
};

export const vendorService = {
  getAll: async () => {
    const response = await superApi.get('/super/vendors/');
    return response.data;
  },

  forceDeactivate: async (id, reason) => {
    const response = await superApi.post(`/super/vendors/${id}/force-deactivate/`, { reason });
    return response.data;
  },

  forceReset: async (id) => {
    const response = await superApi.post(`/super/vendors/${id}/force-reset/`);
    return response.data;
  },

  hardDelete: async (id) => {
    const response = await superApi.delete(`/super/vendors/${id}/`);
    return response.data;
  },
};

export const auditLogService = {
  getAll: async (params = {}) => {
    const response = await superApi.get('/super/audit-logs/', { params });
    return response.data;
  },
};

export default superApi;
