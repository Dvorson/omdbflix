import axios from 'axios';
import { MovieDetails, SearchResult, SearchParams } from '@repo/types';

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Axios Instance for API calls ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add JWT token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from a secure place (e.g., state management, secure cookie, or localStorage *only* for the token)
    // For simplicity now, we'll assume a function getToken() exists, 
    // which AuthContext will provide later.
    const token = getToken(); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Placeholder for token retrieval - AuthContext will manage this
// WARNING: Storing JWT in localStorage has security implications (XSS).
// Consider HttpOnly cookies or in-memory storage with refresh tokens for production.
let storedToken: string | null = null; 
const getToken = (): string | null => {
  // Temporary: Read from localStorage for now until context is updated
  if (typeof window !== 'undefined') {
      storedToken = localStorage.getItem('token');
  }
  return storedToken;
};
export const setToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }
    storedToken = token;
};
// --- End Placeholder ---

// --- Media API Functions ---

export const searchMovies = async (params: SearchParams): Promise<SearchResult> => {
  try {
    const response = await apiClient.get('/media/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    // Rethrow or return a default error structure
    throw error; 
  }
};

export const getMovieDetails = async (id: string): Promise<MovieDetails> => {
  try {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};

// --- Authentication API Functions ---

export const loginUser = async (credentials: { email: string; password: string }): Promise<{ token: string; user: unknown }> => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    // Store token upon successful login (AuthContext should handle this properly)
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data; 
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: { email: string; password: string; name: string }): Promise<{ token: string; user: unknown }> => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    // Store token upon successful registration
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const checkAuthStatus = async (): Promise<{ isAuthenticated: boolean; user: unknown | null }> => {
  try {
    // If no token exists locally, don't bother hitting the endpoint
    if (!getToken()) {
        return { isAuthenticated: false, user: null };
    }
    const response = await apiClient.get('/auth/status');
    return response.data;
  } catch (error: unknown) {
    // If API returns 401 Unauthorized, it means the token is invalid or expired
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
      setToken(null); // Clear invalid token
      return { isAuthenticated: false, user: null };
    }
    // Log other errors but treat as unauthenticated
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false, user: null }; 
  }
};

export const logoutUser = async (): Promise<{ message: string }> => {
  try {
    // Clear local token immediately
    setToken(null);
    // Inform backend (optional, useful if backend manages sessions/tokens)
    const response = await apiClient.post('/auth/logout'); 
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    // Still proceed with client-side logout even if backend call fails
    setToken(null);
    throw error;
  }
};

// --- Favorites API Functions (Protected) ---

export const getFavorites = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/favorites');
    // Backend returns an array of movie IDs
    return response.data; 
  } catch (error) {
    console.error('Error getting favorites:', error);
    // Return empty array or throw, depending on how UI handles errors
    return []; 
  }
};

export const addFavorite = async (movieId: string): Promise<{ message: string; movieId: string }> => {
  try {
    const response = await apiClient.post('/favorites', { movieId });
    return response.data;
  } catch (error) {
    console.error(`Error adding favorite ${movieId}:`, error);
    throw error;
  }
};

export const removeFavorite = async (movieId: string): Promise<{ message: string; movieId: string }> => {
  try {
    const response = await apiClient.delete(`/favorites/${movieId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing favorite ${movieId}:`, error);
    throw error;
  }
};

// --- Cleanup: Remove old localStorage based favorite functions ---
// Removed: isInFavorites, saveToFavorites, removeFromFavorites (old versions), getUserFavorites (old version)