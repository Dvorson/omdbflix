// Common types used across frontend and backend

// Authentication types
export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Error types
export interface ApiError extends Error {
  code?: number | string;
  status?: number;
}

// Database types
export interface SQLiteError extends Error {
  code?: string;
}

// Authentication info interface for passport
export interface AuthInfo {
  message?: string;
}

// User data interface
export interface UserData {
  id?: number;
  email: string;
  password?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
} 