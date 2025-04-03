import axios from 'axios';
import { getFromCache, setCache } from './cache.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js'; // Import config for API key/URL
import { validateYearParameter } from '../utils/validation.js';

console.log('>>> Loading module: services/mediaService.js');

// Environment variables / Config values
const OMDB_API_URL = config.omdbApiUrl || 'http://www.omdbapi.com';
const OMDB_API_KEY = config.omdbApiKey;

// Validate OMDB API Key on module load (fail fast)
if (!OMDB_API_KEY) {
  logger.error('FATAL ERROR: OMDB_API_KEY is not defined in environment variables or .env file.');
  // Optional: Exit process if API key is critical for startup
  // process.exit(1);
}

// Cache TTL in seconds
const SEARCH_CACHE_TTL = 60 * 10; // 10 minutes
const DETAILS_CACHE_TTL = 60 * 60 * 24; // 24 hours

// Error class for media service
export class MediaServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'MediaServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Search for media by title/query with optional filters
 * @param {object} params - Search parameters
 * @param {string} params.query - Search term
 * @param {string} [params.type] - Media type (movie, series, episode)
 * @param {string} [params.year] - Release year
 * @param {number} [params.page=1] - Page number
 * @returns {Promise<object>} - OMDB API search result
 */
export async function searchMedia(params) {
  const { query, type, year, page = 1 } = params;

  logger.debug('searchMedia called with params:', JSON.stringify({ query, type, year, page }));

  if (!query) {
    throw new MediaServiceError('Search query is required', 400);
  }
  if (!OMDB_API_KEY) {
      throw new MediaServiceError('OMDB API key is not configured', 500);
  }

  // Create cache key
  const cacheKey = `search:${query}:${type || 'all'}:${year || 'all'}:${page}`;

  // Try cache first
  try {
    const cachedResult = await getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Cache hit for search: ${cacheKey}`);
      return cachedResult;
    }
  } catch (cacheError) {
    logger.warn(`Cache lookup failed for key ${cacheKey}:`, cacheError);
    // Continue without cache if lookup fails
  }
  logger.debug(`Cache miss for search: ${cacheKey}`);

  // Build request parameters
  const requestParams = {
    apikey: OMDB_API_KEY,
    s: query,
    page: page.toString(),
  };

  // Add optional parameters
  if (type) requestParams.type = type;
  if (year && validateYearParameter(year)) {
    requestParams.y = year;
  } else if (year) {
    logger.warn(`Invalid year parameter ignored in search: ${year}`);
  }

  try {
    // Make API request
    const response = await axios.get(OMDB_API_URL, { params: requestParams });
    const result = response.data;

    // Handle OMDB API errors explicitly
    if (result.Response === 'False') {
      logger.warn(`OMDB API error for search "${query}": ${result.Error}`);
      // Specific handling for known OMDB errors if needed
      if (result.Error === 'Movie not found!') {
          // Return standard structure even if no results
          return { Response: 'True', Search: [], totalResults: '0' };
      }
      // Throw a generic error for other OMDB issues
      throw new MediaServiceError(result.Error || 'Failed to fetch data from OMDB', 400); // Treat API error as bad request if specific
    }

    // Cache successful results
    if (result.Response === 'True') {
      try {
        await setCache(cacheKey, result, SEARCH_CACHE_TTL);
      } catch (cacheError) {
         logger.warn(`Failed to cache result for key ${cacheKey}:`, cacheError);
         // Continue even if caching fails
      }
    }

    return result;

  } catch (error) {
    // Re-throw known MediaServiceErrors
    if (error instanceof MediaServiceError) {
        throw error;
    }
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 503; // 503 Service Unavailable if OMDB is down
      const message = error.response?.data?.Error || error.message || 'Failed to search media via OMDB API';
      logger.error(`OMDB API search Axios error: ${message}`, { status: statusCode, query: requestParams.s });
      throw new MediaServiceError(message, statusCode);
    }
    // Handle unexpected errors
    logger.error(`Unexpected error in searchMedia: ${error.message}`, error);
    throw new MediaServiceError(error.message || 'An unexpected error occurred during media search', 500);
  }
}

/**
 * Get detailed information about a specific media item by ID
 * @param {string} id - IMDB ID
 * @returns {Promise<object>} - OMDB API details result
 */
export async function getMediaById(id) {
  logger.debug(`getMediaById called with ID: ${id}`);

  if (!id) {
    throw new MediaServiceError('Media ID is required', 400);
  }
  if (!OMDB_API_KEY) {
      throw new MediaServiceError('OMDB API key is not configured', 500);
  }

  // Create cache key
  const cacheKey = `media:${id}`;

  // Try cache first
  try {
      const cachedResult = await getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug(`Cache hit for media details: ${cacheKey}`);
        return cachedResult;
      }
  } catch (cacheError) {
      logger.warn(`Cache lookup failed for key ${cacheKey}:`, cacheError);
  }
  logger.debug(`Cache miss for media details: ${cacheKey}`);

  try {
    // Make API request
    const response = await axios.get(OMDB_API_URL, {
      params: {
        apikey: OMDB_API_KEY,
        i: id,
        plot: 'full',
      },
    });

    const result = response.data;

    // Handle OMDB API errors explicitly
    if (result.Response === 'False') {
      logger.warn(`OMDB API error for ID "${id}": ${result.Error}`);
      // Treat "Incorrect IMDb ID." or "Error getting data." as 404 Not Found
      if (result.Error && (result.Error.includes('Incorrect IMDb ID') || result.Error.includes('Error getting data'))) {
          throw new MediaServiceError(result.Error, 404);
      }
      // Throw a generic error for other OMDB issues
      throw new MediaServiceError(result.Error || 'Failed to fetch details from OMDB', 500);
    }

    // Cache successful results
    if (result.Response === 'True') {
       try {
            await setCache(cacheKey, result, DETAILS_CACHE_TTL);
       } catch (cacheError) {
           logger.warn(`Failed to cache result for key ${cacheKey}:`, cacheError);
       }
    }

    return result;

  } catch (error) {
      // Re-throw known MediaServiceErrors
      if (error instanceof MediaServiceError) {
          throw error;
      }
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 503;
        const message = error.response?.data?.Error || error.message || 'Failed to get media details via OMDB API';
        logger.error(`OMDB API details Axios error: ${message}`, { status: statusCode, id });
        // Map 401 from OMDB (Invalid API key?) to 500 internal error
        throw new MediaServiceError(message, statusCode === 401 ? 500 : statusCode);
      }
      // Handle unexpected errors
      logger.error(`Unexpected error in getMediaById: ${error.message}`, error);
      throw new MediaServiceError(error.message || 'An unexpected error occurred fetching media details', 500);
  }
} 