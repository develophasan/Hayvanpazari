import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Constants from 'expo-constants';
import storage from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
console.log('🔗 AuthContext API_BASE_URL:', API_BASE_URL);

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: string;
  is_verified?: boolean;
  is_phone_verified?: boolean;
  profile_image?: string;
  location?: {
    city: string;
    district: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('🔍 Loading stored auth...');
      const storedToken = await storage.getItem('auth_token');
      const storedUser = await storage.getItem('user_data');

      console.log('📥 Stored token:', storedToken ? 'Var' : 'Yok');
      console.log('📥 Stored user:', storedUser ? 'Var' : 'Yok');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ Auth restored from storage');
      } else {
        console.log('ℹ️ No stored auth found');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, storing token and user data:', data.user);
        await storage.setItem('auth_token', data.access_token);
        await storage.setItem('user_data', JSON.stringify(data.user));
        
        setToken(data.access_token);
        setUser(data.user);
        
        console.log('Auth state updated, user:', data.user.first_name);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        await storage.setItem('auth_token', data.access_token);
        await storage.setItem('user_data', JSON.stringify(data.user));
        
        setToken(data.access_token);
        setUser(data.user);
        
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem('auth_token');
      await storage.removeItem('user_data');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      storage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};