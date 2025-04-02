import axios from 'axios';
import { MovieDetails, SearchResult, SearchParams, AuthUser } from '@repo/types';

const token: string | null = null;
const apiClient = axios.create({});

apiClient.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    const response = await apiClient.get('/media/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
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


export const loginUser = async (credentials: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
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
    const response = await apiClient.post('/auth/register', userData);
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
    const response = await apiClient.get('/auth/status');
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
    setToken(null);
    const response = await apiClient.post('/auth/logout'); 
    return response.data;
  } catch (error) {
    setToken(null);
    throw error;
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/favorites');
    return response.data; 
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
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

