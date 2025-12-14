import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

const TOKEN_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';

export function AuthProvider({ children }) {
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
      const response = await authService.refresh(refreshToken);
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
      const userData = await authService.getMe();
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
      const response = await authService.login(email, password);
      storeTokens(response.access, response.refresh);
      
      const userData = await authService.getMe();
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

  const hasPermission = (permission) => {
    if (!user) return false;
    return user[permission] === true;
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    getToken: getStoredToken,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
