// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Image Upload Configuration
export const IMAGE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  maxImages: 5
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  defaultDateRange: 30, // days
  chartColors: {
    primary: '#4F46E5',
    secondary: '#10B981',
    error: '#EF4444'
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  dashboardStats: 5 * 60 * 1000, // 5 minutes
  courtList: 10 * 60 * 1000, // 10 minutes
  offerList: 10 * 60 * 1000 // 10 minutes
};