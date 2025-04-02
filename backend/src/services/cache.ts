import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Environment variables with defaults for local development
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10); // Default: 1 hour

// Create Redis client
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 */
export function initializeCache(): void {
  try {
    redisClient = new Redis(REDIS_URL, {
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redisClient = null;
  }
}

/**
 * Check if Redis is available
 */
export function isCacheAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Get value from cache
 * @param key Cache key
 * @returns Cached value or null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!isCacheAvailable()) {
    return null;
  }

  try {
    const data = await redisClient!.get(key);
    
    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(`Error retrieving key ${key} from cache:`, error);
    return null;
  }
}

/**
 * Set value in cache with expiration time
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (optional, defaults to CACHE_TTL)
 */
export async function setCache<T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<void> {
  if (!isCacheAvailable()) {
    return;
  }

  try {
    const serializedValue = JSON.stringify(value);
    await redisClient!.set(key, serializedValue, 'EX', ttl);
  } catch (error) {
    logger.error(`Error setting key ${key} in cache:`, error);
  }
}

/**
 * Remove value from cache
 * @param key Cache key
 */
export async function removeFromCache(key: string): Promise<void> {
  if (!isCacheAvailable()) {
    return;
  }

  try {
    await redisClient!.del(key);
  } catch (error) {
    logger.error(`Error removing key ${key} from cache:`, error);
  }
}

/**
 * Clear entire cache
 * Warning: Use with caution
 */
export async function clearCache(): Promise<void> {
  if (!isCacheAvailable()) {
    return;
  }

  try {
    await redisClient!.flushdb();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
    }
  }
} 