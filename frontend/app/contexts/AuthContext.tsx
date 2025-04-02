'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { 
    loginUser as apiLoginUser, 
    registerUser as apiRegisterUser, 
    checkAuthStatus as apiCheckAuthStatus, 
    logoutUser as apiLogoutUser,
    setToken as apiSetToken, // Import setToken to manage the token storage
} from '../services/api'; 

// Define the shape of the user object (adjust as needed based on backend response)
interface User {
  id: number;
  email: string;
  name: string;
  // Add other relevant fields returned by the backend /auth/status or /auth/login
}

// Define the shape of the context value - EXPORT this type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To indicate initial auth check or ongoing login/register
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkStatus: () => Promise<void>; // Function to manually re-check status if needed
  // Removed updateFavorites - favorites are managed via direct API calls now
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading on initial mount

  // Function to check authentication status using the API
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { isAuthenticated: authStatus, user: userData } = await apiCheckAuthStatus();
      setIsAuthenticated(authStatus);
      setUser(authStatus ? userData : null);
      console.log('[AuthContext] Checked status:', { authStatus, userData });
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      apiSetToken(null); // Ensure token is cleared on error during check
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check status on initial mount
  useEffect(() => {
    console.log('[AuthContext] Initial mount: checking auth status...');
    checkStatus();
  }, [checkStatus]);

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await apiLoginUser(credentials);
      // apiLoginUser already calls setToken internally via api.ts
      setUser(loggedInUser);
      setIsAuthenticated(true);
      console.log('[AuthContext] Login successful:', loggedInUser);
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      apiSetToken(null); // Clear token on login failure
      throw error; // Rethrow to allow component to handle UI feedback
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: { email: string; password: string; name: string }) => {
    setIsLoading(true);
    try {
      const { user: registeredUser } = await apiRegisterUser(userData);
      // apiRegisterUser already calls setToken internally via api.ts
      setUser(registeredUser);
      setIsAuthenticated(true);
      console.log('[AuthContext] Registration successful:', registeredUser);
    } catch (error) {
      console.error('[AuthContext] Registration failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      apiSetToken(null); // Clear token on registration failure
      throw error; // Rethrow for UI handling
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogoutUser(); // Calls setToken(null) internally via api.ts
      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Still ensure client state is cleared even if API call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Value provided by the context
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkStatus, // Expose checkStatus if needed externally
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the Auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 