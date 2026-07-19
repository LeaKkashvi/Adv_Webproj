import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import apiClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [advocateProfile, setAdvocateProfile] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthHeader = useCallback((token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const refreshResponse = await authApi.refresh();
      const { accessToken: newToken } = refreshResponse.data;
      setAccessToken(newToken);
      setAuthHeader(newToken);

      const profileResponse = await userApi.getProfile();
      setUser(profileResponse.data.user);
      setAdvocateProfile(profileResponse.data.advocateProfile);
    } catch {
      setUser(null);
      setAdvocateProfile(null);
      setAccessToken(null);
      setAuthHeader(null);
    }
  }, [setAuthHeader]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await loadUser();
      } catch {
        // Silent fail on initial load
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [loadUser]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { user: userData, advocateProfile: profileData, accessToken: token } = response.data;

    setAccessToken(token);
    setAuthHeader(token);
    setUser(userData);
    setAdvocateProfile(profileData);

    return response.data;
  };

  const registerClient = async (data) => {
    const response = await authApi.registerClient(data);
    return response.data;
  };

  const registerAdvocate = async (data) => {
    const response = await authApi.registerAdvocate(data);
    return response.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API fails
    } finally {
      setUser(null);
      setAdvocateProfile(null);
      setAccessToken(null);
      setAuthHeader(null);
    }
  };

  const refreshProfile = async () => {
    const profileResponse = await userApi.getProfile();
    setUser(profileResponse.data.user);
    setAdvocateProfile(profileResponse.data.advocateProfile);
  };

  const value = {
    user,
    advocateProfile,
    accessToken,
    loading,
    login,
    registerClient,
    registerAdvocate,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
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
