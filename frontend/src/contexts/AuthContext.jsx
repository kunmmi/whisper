/**
 * Authentication Context
 * Manages user authentication state and provides auth functions
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getMe();
          setUser(response.data.user);
          setToken(storedToken);
          // Initialize socket connection
          initSocket(storedToken);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Register a new user
   */
  const register = async (email, username, password) => {
    try {
      const response = await authAPI.register({ email, username, password });
      const { user: userData, token: userToken } = response.data;

      // Store token and user
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);

      // Initialize socket connection
      initSocket(userToken);

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Check if identifier is an email
   */
  const isEmail = (str) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  };

  /**
   * Login user
   */
  const login = async (identifier, password) => {
    try {
      // Determine if identifier is email or username
      const loginData = isEmail(identifier) 
        ? { email: identifier, password }
        : { username: identifier, password };
      
      const response = await authAPI.login(loginData);
      const { user: userData, token: userToken } = response.data;

      // Store token and user
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);

      // Initialize socket connection
      initSocket(userToken);

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    disconnectSocket();
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  /**
   * Update user data (e.g., after profile picture update)
   */
  const updateUser = async () => {
    try {
      const response = await authAPI.getMe();
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update user data:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    isAuthenticated,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

