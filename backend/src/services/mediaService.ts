import axios from 'axios';
import { getFromCache, setCache } from './cache';
import { logger } from '../utils/logger';
import { SearchParams } from '@repo/types';

// Environment variables
const OMDB_API_URL = process.env.OMDB_API_URL || 'http://www.omdbapi.com';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

// Cache TTL in seconds
const SEARCH_CACHE_TTL = 60 * 10; // 10 minutes
const DETAILS_CACHE_TTL = 60 * 60 * 24; // 24 hours

// Error class for media service
export class MediaServiceError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'MediaServiceError';
    this.statusCode = statusCode;
  }
}

interface OmdbSearchParams {
  apikey: string;
  s: string;
  page: string;
  type?: string;
  y?: string;
}

/**
 * Search for media by title/query with optional filters
 */
export async function searchMedia(params: SearchParams) {
  try {
    const { query, type, year, page = 1 } = params;
    
    if (!query) {
      throw new MediaServiceError('Search query is required', 400);
    }

    // Create cache key from search parameters
    const cacheKey = `search:${query}:${type || 'all'}:${year || 'all'}:${page}`;
    
    // Try to get from cache first
    const cachedResult = await getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Cache hit for search: ${cacheKey}`);
      return cachedResult;
    }
    
    // Build request parameters
    const requestParams: OmdbSearchParams = {
      apikey: OMDB_API_KEY,
      s: query,
      page: page.toString(),
    };

    // Add optional parameters if provided
    if (type) requestParams.type = type;
    if (year) requestParams.y = year;
    
    // Make API request
    const response = await axios.get(OMDB_API_URL, { params: requestParams });
    const result = response.data;
    
    // Cache results if successful
    if (result.Response === 'True') {
      await setCache(cacheKey, result, SEARCH_CACHE_TTL);
    }
    
    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = error.response?.data?.Error || error.message || 'Failed to search media';
      logger.error(`Search media error: ${message}`, { error });
      throw new MediaServiceError(message, statusCode);
    }
    
    logger.error(`Unexpected error in searchMedia: ${(error as Error).message}`);
    throw new MediaServiceError((error as Error).message);
  }
}

/**
 * Get detailed information about a specific media item by ID
 */
export async function getMediaById(id: string) {
  try {
    if (!id) {
      throw new MediaServiceError('Media ID is required', 400);
    }
    
    // Create cache key
    const cacheKey = `media:${id}`;
    
    // Try to get from cache first
    const cachedResult = await getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Cache hit for media details: ${cacheKey}`);
      return cachedResult;
    }
    
    // Make API request
    const response = await axios.get(OMDB_API_URL, {
      params: {
        apikey: OMDB_API_KEY,
        i: id,
        plot: 'full',
      },
    });
    
    const result = response.data;
    
    // Check if result is an error
    if (result.Response === 'False') {
      throw new MediaServiceError(result.Error || 'Media not found', 404);
    }
    
    // Cache successful results
    await setCache(cacheKey, result, DETAILS_CACHE_TTL);
    
    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = error.response?.data?.Error || error.message || 'Failed to get media details';
      logger.error(`Get media details error: ${message}`, { error });
      throw new MediaServiceError(message, statusCode);
    }
    
    if (error instanceof MediaServiceError) {
      throw error;
    }
    
    logger.error(`Unexpected error in getMediaById: ${(error as Error).message}`);
    throw new MediaServiceError((error as Error).message);
  }
} 