import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useApi } from '../services/api.ts';

interface AuthState {
  isAuthenticated: boolean;
  userType: string | null;
  token: string | null;
  user: any | null;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userType: null,
  token: null,
  user: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const { api } = useApi();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
  const storedToken = await (AsyncStorage as any).getItem('auth_token');
      if (storedToken) {
        await login(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  };

  const login = async (tokenOrEmail: string, password?: string) => {
    try {
      let token = tokenOrEmail;
      let user;
      
      // If password provided, it's email/password login
      if (password) {
        const response = await api.login(tokenOrEmail, password);
        token = response.access_token;
        user = response.user;
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('refresh_token', response.refresh_token);
      } else {
        // Token provided, get user profile
        if (typeof api.setToken === 'function') {
          api.setToken(token);
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const response = await api.get('/auth/me/');
        user = response.data;
      }

      // Determine user type
      let userType = null;
      if (user.vendor_profile) {
        userType = user.vendor_profile.vendor_type;
      } else if (user.customer_profile) {
        userType = 'CUSTOMER';
      }

      // Update auth state
      const newState = {
        isAuthenticated: true,
        token,
        user,
        userType,
      };

      setAuthState(newState);

      // Route based on user type and onboarding status
      if (user.vendor_profile?.onboarding_status?.is_submitted === false) {
        router.replace('/onboarding/start' as any);
      } else {
        switch (userType) {
          case 'VENUE':
            router.replace('/dashboard' as any);
            break;
          case 'COACH':
            router.replace('/coach-dashboard' as any);
            break;
          case 'ECOMMERCE':
            router.replace('/store-dashboard' as any);
            break;
          case 'CUSTOMER':
            router.replace('/home' as any);
            break;
          default:
            router.replace('/auth/login' as any);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      await logout();
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await api.logout(refreshToken);
        } catch (e) {
          // Ignore logout errors
        }
      }
      
      if (typeof api.clearToken === 'function') {
        api.clearToken();
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      setAuthState(initialState);
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: user } = await api.get('/auth/me/');
      setAuthState(prev => ({ ...prev, user }));
    } catch (err: any) {
      console.error('Error refreshing user:', err);
      if (err?.response?.status === 401) {
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
