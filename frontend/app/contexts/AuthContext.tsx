import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
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
  console.log('🚀 AuthProvider constructor called');
  
  // DEMO USER: Ahmet (Satıcı) - has listings
  const demoUser: User = {
    id: '13140f90-4a33-4026-9e2a-92c76c1a7c56',
    email: 'ahmet@satici.com',
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
    phone: '+905551111111',
    user_type: 'seller'
  };
  
  const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTMxNDBmOTAtNGEzMy00MDI2LTllMmEtOTJjNzZjMWE3YzU2IiwiZXhwIjoxNzU5MjkwNzk0fQ.MUH8TtgTss41jMGEOZ4V-_RwKab5-3-owsbVYd8YYVs';
  
  const [user, setUser] = useState<User | null>(demoUser);
  const [token, setToken] = useState<string | null>(demoToken);
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔄 AuthProvider state:', { user: user?.first_name, isLoading, token: token ? 'exists' : 'none' });
  console.log('👤 Demo User: Ahmet Yılmaz (Satıcı) - 6 ilan mevcut');

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔗 Login attempt with API_BASE_URL:', API_BASE_URL);
      console.log('🔗 Full login URL:', `${API_BASE_URL}/api/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login response status:', response.status);
      const data = await response.json();
      console.log('📡 Login response data:', data);

      if (response.ok) {
        console.log('✅ Login successful, storing token and user data:', data.user);
        await storage.setItem('auth_token', data.access_token);
        await storage.setItem('user_data', JSON.stringify(data.user));
        
        setToken(data.access_token);
        setUser(data.user);
        
        console.log('✅ Auth state updated, user:', data.user.first_name);
        return { success: true };
      } else {
        console.log('❌ Login failed:', data);
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login network error:', error);
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