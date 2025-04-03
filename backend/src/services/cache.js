import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

// Environment variables with defaults
const REDIS_URL = config.redisUrl || 'redis://localhost:6380'; // Use config value
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'; // Allow override via env
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10); // Default: 1 hour

// Redis client instance
let redisClient = null;

/**
 * Initialize Redis client
 */
export function initializeCache() {
  // Skip Redis initialization if disabled or in test environment
  if (!REDIS_ENABLED || config.nodeEnv === 'test') {
    logger.info(`Redis cache is ${!REDIS_ENABLED ? 'disabled' : 'skipped in test environment'}.`);
    return;
  }

  if (!config.redisUrl) {
    logger.warn('REDIS_URL is not configured in .env or environment variables. Skipping Redis initialization.');
    return;
  }

  try {
    // Create Redis client
    redisClient = new Redis(REDIS_URL, {
      // Options to prevent hanging if Redis is unavailable
      enableOfflineQueue: false, // Don't queue commands if disconnected
      connectTimeout: 5000, // 5 seconds connection timeout
      maxRetriesPerRequest: 1, // Don't retry commands automatically
      retryStrategy(times) {
        // Custom retry strategy
        if (times > 1) {
          // Only log warning after the first failed attempt
          logger.warn(`Redis connection failed after ${times} attempts. Giving up on reconnecting for now.`);
          return null; // Stop retrying
        }
        logger.info(`Attempting Redis connection (attempt ${times})...`);
        return 1000; // Retry after 1 second
      }
    });

    redisClient.on('connect', () => {
      logger.info(`Redis client connected to ${REDIS_URL}`);
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready.');
    });

    redisClient.on('error', (err) => {
      // Log specific errors, especially connection refused
      if (err.code === 'ECONNREFUSED') {
        logger.error(`Redis connection refused at ${REDIS_URL}. Ensure Redis server is running and accessible.`);
      } else {
        logger.error('Redis client error:', err);
      }
      // Consider setting redisClient to null here if error is fatal
      // redisClient = null;
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection closed.');
      // Setting to null ensures isCacheAvailable returns false
      redisClient = null;
    });

  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redisClient = null;
  }
}

/**
 * Check if Redis is available and ready
 */
export function isCacheAvailable() {
  // Check if client exists and its status is 'ready'
  return !!redisClient && redisClient.status === 'ready';
}

/**
 * Get value from cache
 * @param {string} key Cache key
 * @returns {Promise<object|null>} Cached value or null if not found/error
 */
export async function getFromCache(key) {
  if (!isCacheAvailable()) {
    logger.debug(`Cache unavailable, skipping get for key: ${key}`);
    return null;
  }

  try {
    const data = await redisClient.get(key);
    if (!data) {
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    }
    logger.debug(`Cache hit for key: ${key}`);
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error retrieving key ${key} from cache:`, error);
    return null;
  }
}

/**
 * Set value in cache with expiration time
 * @param {string} key Cache key
 * @param {object} value Value to cache
 * @param {number} [ttl=CACHE_TTL] Time to live in seconds
 */
export async function setCache(key, value, ttl = CACHE_TTL) {
  if (!isCacheAvailable()) {
    logger.debug(`Cache unavailable, skipping set for key: ${key}`);
    return;
  }

  try {
    const serializedValue = JSON.stringify(value);
    await redisClient.set(key, serializedValue, 'EX', ttl);
    logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
  } catch (error) {
    logger.error(`Error setting key ${key} in cache:`, error);
  }
}

/**
 * Remove value from cache
 * @param {string} key Cache key
 */
export async function removeFromCache(key) {
  if (!isCacheAvailable()) {
    logger.debug(`Cache unavailable, skipping remove for key: ${key}`);
    return;
  }

  try {
    await redisClient.del(key);
    logger.debug(`Cache removed for key: ${key}`);
  } catch (error) {
    logger.error(`Error removing key ${key} from cache:`, error);
  }
}

/**
 * Clear entire cache (use with caution)
 */
export async function clearCache() {
  if (!isCacheAvailable()) {
    logger.warn('Attempted to clear cache, but cache is unavailable.');
    return;
  }

  try {
    await redisClient.flushdb();
    logger.info('Redis cache cleared (flushdb).');
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeCache() {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    try {
      // Use disconnect() for immediate closure
      await redisClient.disconnect();
      logger.info('Redis connection closed.');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    } finally {
      // Ensure client is nulled even if disconnect fails
      redisClient = null;
    }
  }
} 