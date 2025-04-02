import axios from 'axios';
import { MovieDetails, SearchResult, SearchParams, AuthUser } from '@repo/types';

// Get API URL from environment, fallback to a default for development
// Don't include '/api' here as the backend routes already include it
const API_BASE_URL = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('API Base URL:', API_BASE_URL);

const token: string | null = null;
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// Add retry logic for network errors
apiClient.interceptors.response.use(undefined, async (error) => {
  // Only retry on network errors and 5xx responses, not 4xx
  const isNetworkError = !error.response;
  const is5xxError = error.response?.status >= 500;
  const config = error.config;
  
  // Only retry if we haven't already
  if ((isNetworkError || is5xxError) && !config._retry && config.method === 'get') {
    console.log(`Retrying request to ${config.url} due to network/server error`);
    config._retry = true;
    return new Promise(resolve => setTimeout(() => resolve(apiClient(config)), 1000));
  }
  
  return Promise.reject(error);
});

apiClient.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// WARNING: Storing JWT in localStorage has security implications (XSS).
// Consider HttpOnly cookies or in-memory storage with refresh tokens for production.
let storedToken: string | null = null; 
const getToken = (): string | null => {
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


export const searchMovies = async (params: SearchParams): Promise<SearchResult> => {
  try {
    const response = await apiClient.get('/api/media/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (id: string): Promise<MovieDetails> => {
  try {
    const response = await apiClient.get(`/api/media/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};


export const loginUser = async (credentials: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> => {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data; 
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: { email: string; password: string; name: string }): Promise<{ token: string; user: AuthUser }> => {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const checkAuthStatus = async (): Promise<{ isAuthenticated: boolean; user: AuthUser | null }> => {
  try {
    if (!getToken()) {
        return { isAuthenticated: false, user: null };
    }
    const response = await apiClient.get('/api/auth/status');
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
      setToken(null);
      return { isAuthenticated: false, user: null };
    }
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false, user: null }; 
  }
};

export const logoutUser = async (): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/auth/logout'); 
    setToken(null);
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    setToken(null);
    throw error;
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/api/favorites');
    return response.data; 
  } catch (error) {
    console.error('Error getting favorites:', error);
    return []; // Return empty array on error
  }
};

export const addFavorite = async (movieId: string): Promise<{ message: string; movieId: string }> => {
  try {
    const response = await apiClient.post('/api/favorites', { movieId });
    return response.data;
  } catch (error) {
    console.error(`Error adding favorite ${movieId}:`, error);
    throw error;
  }
};

export const removeFavorite = async (movieId: string): Promise<{ message: string; movieId: string }> => {
  try {
    const response = await apiClient.delete(`/api/favorites/${movieId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing favorite ${movieId}:`, error);
    throw error;
  }
};

