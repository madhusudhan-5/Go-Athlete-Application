// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Types
export interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  is_verified: boolean;
  is_active: boolean;
  auth_provider: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  is_new_user: boolean;
}

export interface SocialAuthRequest {
  email: string;
  name?: string;
  provider_id: string;
  auth_provider: 'google' | 'apple';
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
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

  // Authentication methods
  async sendOTP(email: string): Promise<{ message: string; email: string }> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase() }),
    });
  }

  async verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase(), 
        otp_code: otpCode 
      }),
    });
  }

  async socialLogin(data: SocialAuthRequest): Promise<AuthResponse> {
    return this.request('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        email: data.email.toLowerCase(),
      }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or multiple instances
export default ApiService;
