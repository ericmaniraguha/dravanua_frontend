import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('adminUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check session and true backend role status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if (res.status === 401 || !result.success) {
            // Kick user out because role was demoted, disabled, or token died
            setUser(null);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/admin/login');
          } else {
            // Synchronize the frontend's concept of the user role to the exact DB truth
            setUser(result.data);
            localStorage.setItem('adminUser', JSON.stringify(result.data));
          }
        } catch (error) {
          console.error('Session sync error', error);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
  };

  /**
   * Secure Fetch Wrapper
   * Automatically handles 401 (Refresh)
   */
  const secureFetch = async (url, options = {}) => {
    let token = localStorage.getItem('adminToken');
    
    // Add auth header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/refresh`, {
        method: 'POST',
        credentials: 'include' // Important for cookies
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        localStorage.setItem('adminToken', refreshData.token);
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshData.token}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed (cookie expired/invalid) -> Forced Logout
        logout();
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, secureFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
