import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { superAuthService } from '../services/superApi';

const SuperAuthContext = createContext();

const TOKEN_KEY = 'super_access_token';
const REFRESH_KEY = 'super_refresh_token';

export function SuperAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isRefreshing = useRef(false);

  const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
  const getStoredRefresh = () => localStorage.getItem(REFRESH_KEY);

  const storeTokens = (access, refresh) => {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setError(null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing.current) return null;
    
    const refreshToken = getStoredRefresh();
    if (!refreshToken) {
      logout();
      return null;
    }

    isRefreshing.current = true;
    try {
      const response = await superAuthService.refresh(refreshToken);
      storeTokens(response.access, null);
      isRefreshing.current = false;
      return response.access;
    } catch (err) {
      console.error('Token refresh failed:', err);
      isRefreshing.current = false;
      logout();
      return null;
    }
  }, [logout]);

  const fetchUser = useCallback(async (retryOnFail = true) => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await superAuthService.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      
      if (err.response?.status === 401 && retryOnFail) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchUser(false);
        }
      }
      
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await superAuthService.login(email, password);
      storeTokens(response.access, response.refresh);
      
      const userData = await superAuthService.getMe();
      setUser(userData);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          'Invalid email or password';
      setError(errorMessage);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    login,
    logout,
    getToken: getStoredToken,
    refreshAccessToken,
  };

  return <SuperAuthContext.Provider value={value}>{children}</SuperAuthContext.Provider>;
}

export function useSuperAuth() {
  const context = useContext(SuperAuthContext);
  if (!context) {
    throw new Error('useSuperAuth must be used within a SuperAuthProvider');
  }
  return context;
}

export default SuperAuthContext;
