// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  role: 'vendor' | 'customer' | 'admin' | 'super_admin';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  capacity: number;
  is_active: boolean;
}

export interface Booking {
  id: number;
  service: Service;
  customer: User;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  number_of_people: number;
  total_price: number;
  created_at: string;
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;
  // Minimal axios-like defaults object used by callers
  public defaults: { headers: { common: Record<string, string> } } = {
    headers: { common: {} },
  };

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    this.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    delete this.defaults.headers.common['Authorization'];
  }

  // Get headers for API requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods matching axios-like API used in the codebase
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const res = await this.request<T>(endpoint, { method: 'GET' });
    return { data: res };
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const res = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: res };
  }

  async put<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const res = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: res };
  }

  async delete<T = any>(endpoint: string): Promise<{ data: T }> {
    const res = await this.request<T>(endpoint, { method: 'DELETE' });
    return { data: res };
  }

  // Authentication methods
  async register(data: {
    email: string;
    phone_number?: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }): Promise<any> {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    return this.request('/auth/verify_otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase(),
        password
      }),
    });
  }

  async refreshToken(refresh_token: string): Promise<{ access_token: string; expires_in: number }> {
    return this.request('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request('/auth/me/');
    return response;
  }

  async sendOTP(email: string): Promise<any> {
    // For now, this is handled by register endpoint
    // In production, this would be a separate endpoint
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    return this.request('/auth/verify_otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async logout(refresh_token?: string): Promise<void> {
    return this.request('/auth/logout/', {
      method: 'POST',
      body: refresh_token ? JSON.stringify({ refresh_token }) : undefined,
    });
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return this.request('/vendor/services/');
  }

  async createService(data: Omit<Service, 'id' | 'is_active'>): Promise<Service> {
    return this.request('/vendor/services/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    return this.request(`/vendor/services/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Booking methods
  async getBookings(params?: {
    date?: string;
    status?: string;
    court_id?: string;
    payment_status?: string;
    page?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.court_id) queryParams.append('court_id', params.court_id);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const endpoint = `/vendor/bookings/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(endpoint);
  }

  async getBooking(id: string): Promise<Booking> {
    return this.request(`/vendor/bookings/${id}/`);
  }

  async createBooking(data: {
    court_id: string;
    customer_phone?: string;
    customer_email?: string;
    customer_name?: string;
    customer_user_id?: string;
    date: string;
    start_time: string;
    end_time: string;
    payment_method: string;
    customer_notes?: string;
    internal_notes?: string;
    apply_offer_id?: string;
  }): Promise<Booking> {
    return this.request('/vendor/bookings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rescheduleBooking(id: string, data: {
    new_date: string;
    new_start_time: string;
    new_end_time: string;
  }): Promise<Booking> {
    return this.request(`/vendor/bookings/${id}/reschedule/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return this.request(`/vendor/bookings/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || '' }),
    });
  }

  // Analytics methods
  async getAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/vendor/analytics/?period=${period}`);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
// Helper hook-like accessor used across the app
export function useApi() {
  return { api: apiService };
}

// Default export kept for existing default imports expecting a hook
export default useApi;
