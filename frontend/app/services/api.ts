import { MovieDetails, SearchParams, SearchResult } from '@repo/types';

// Use a relative URL for client-side requests
// Use absolute URL for server-side requests
const API_BASE_URL_CLIENT = '/api';
const API_BASE_URL_SERVER = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api'; // Get from env or default

/**
 * Custom API error class for consistent error handling throughout the application
 */
export class ApiError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Generic fetch function with consistent error handling
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The parsed response data
 * @throws {ApiError} If the request fails
 */
async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to parse error as JSON
      try {
        const errorData = await response.json();
        throw new ApiError(errorData.error || 'An unknown error occurred', response.status);
      } catch {
        // If parsing as JSON fails, use text content
        const errorText = await response.text();
        throw new ApiError(errorText || `HTTP error ${response.status}`, response.status);
      }
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors or other unexpected errors
    throw new ApiError((error as Error).message || 'Network error occurred');
  }
}

/**
 * Build a URL with query parameters
 * @param baseUrl The base URL (will be determined based on environment)
 * @param params Object containing query parameters
 * @returns Formatted URL with query parameters
 */
function buildUrl(endpoint: string, params: Record<string, string | number | undefined>): string {
  const isServer = typeof window === 'undefined';
  const baseUrl = isServer ? API_BASE_URL_SERVER : API_BASE_URL_CLIENT;
  const fullUrl = `${baseUrl}${endpoint}`; // Construct full URL first

  // For relative URLs (client-side), create URL relative to current origin if needed
  // For absolute URLs (server-side or specified), use as is
  const urlObject = fullUrl.startsWith('/') && !isServer 
    ? new URL(fullUrl, window.location.origin)
    : new URL(fullUrl);
    
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlObject.searchParams.append(key, String(value));
    }
  });
  
  // For relative client-side URLs, return just the pathname and search
  // For server-side or absolute client-side, return full URL
  return fullUrl.startsWith('/') && !isServer 
    ? `${urlObject.pathname}${urlObject.search}` 
    : urlObject.toString();
}

/**
 * Search for media items based on provided parameters
 * @param params Search parameters (query, type, year, page)
 * @returns Promise with search results
 */
export async function searchMedia(params: SearchParams): Promise<SearchResult> {
  const { query, type, year, page } = params;
  
  const url = buildUrl(`/media/search`, {
    query,
    type,
    year,
    page,
  });
  
  return await fetchWithErrorHandling<SearchResult>(url);
}

/**
 * Get detailed information about a media item by ID
 * @param id The IMDB ID of the media
 * @returns Promise with detailed media information
 */
export async function getMediaById(id: string): Promise<MovieDetails> {
  const url = buildUrl(`/media/${id}`, {});
  
  return await fetchWithErrorHandling<MovieDetails>(url, {
    cache: 'no-store',
  });
}

// LocalStorage key for favorites
const FAVORITES_KEY = 'favorites';

/**
 * Get all favorites from localStorage
 * @returns Array of favorite movie items
 */
export function getFavorites(): MovieDetails[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites from localStorage:', error);
    return [];
  }
}

/**
 * Save a movie to favorites in localStorage
 * @param movie The movie to save
 */
export function saveToFavorites(movie: MovieDetails): void {
  try {
    const favorites = getFavorites();
    
    // Check if movie is already in favorites
    if (!favorites.some(item => item.imdbID === movie.imdbID)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites, movie]));
    }
  } catch (error) {
    console.error('Error saving to favorites:', error);
  }
}

/**
 * Remove a movie from favorites in localStorage
 * @param id The IMDB ID of the movie to remove
 */
export function removeFromFavorites(id: string): void {
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(item => item.imdbID !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
}

/**
 * Check if a movie is in favorites
 * @param id The IMDB ID to check
 * @returns Boolean indicating if the movie is in favorites
 */
export function isInFavorites(id: string): boolean {
  try {
    const favorites = getFavorites();
    return favorites.some(item => item.imdbID === id);
  } catch (error) {
    console.error('Error checking favorites:', error);
    return false;
  }
} 