'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { 
    loginUser as apiLoginUser, 
    registerUser as apiRegisterUser, 
    checkAuthStatus as apiCheckAuthStatus, 
    logoutUser as apiLogoutUser,
    setToken as apiSetToken,
} from '../services/api'; 
import { AuthUser } from '@repo/types';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { isAuthenticated: authStatus, user: userData } = await apiCheckAuthStatus();
      setIsAuthenticated(authStatus);
      setUser(authStatus ? userData as AuthUser : null);
      console.log('[AuthContext] Checked status:', { authStatus, userData });
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      apiSetToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Initial mount: checking auth status...');
    checkStatus();
  }, [checkStatus]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await apiLoginUser(credentials);
      setUser(loggedInUser as AuthUser);
      setIsAuthenticated(true);
      console.log('[AuthContext] Login successful:', loggedInUser);
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      apiSetToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; name: string }) => {
    setIsLoading(true);
    try {
      const { user: registeredUser } = await apiRegisterUser(userData);
      setUser(registeredUser as AuthUser);
      setIsAuthenticated(true);
      console.log('[AuthContext] Registration successful:', registeredUser);
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      apiSetToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogoutUser();
      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 