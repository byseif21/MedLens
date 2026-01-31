import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { getCurrentUser, setSession, clearSession } from '../services/auth';
import { getProfile } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const response = await getProfile(userId);
      if (response.success) {
        return response.data;
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
    return null;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getCurrentUser();
      if (storedUser) {
        const profileData = await fetchUserProfile(storedUser.id);
        if (profileData) {
          setUser({ ...storedUser, ...profileData });
        } else {
          setUser(storedUser);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchUserProfile]);

  const login = useCallback(
    async (data) => {
      setSession(data);

      // Initial basic user from login response
      const basicUser = {
        id: data.user_id,
        name: data.name,
        role: data.role || 'user',
      };

      setUser(basicUser);

      // Fetch full details (avatar, etc) immediately
      if (data.user_id) {
        const profileData = await fetchUserProfile(data.user_id);
        if (profileData) {
          setUser((prev) => ({ ...prev, ...profileData }));
        }
      }
    },
    [fetchUserProfile]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    // Optional: Navigate to login here if we had access to router,
    // but usually better to let components handle navigation or use a protected route wrapper
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
