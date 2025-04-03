import { logger } from '../utils/logger.js'; // Import logger for potential debugging

/**
 * Validate search parameters middleware
 * - query: required, string
 * - type: optional, one of 'movie', 'series', 'episode', or undefined
 * - year: optional, should be a valid year format (YYYY)
 * - page: optional, should be a positive integer
 */
export function validateSearchParams(req, res, next) {
  const { query, type, year, page } = req.query;

  // Validate query parameter (required)
  if (!query || typeof query !== 'string' || query.trim() === '') {
    logger.warn('Validation failed: Missing or invalid search query.');
    return res.status(400).json({ error: 'Search query is required and must be a non-empty string' });
  }

  // Validate type parameter if provided
  if (type !== undefined) {
      if (typeof type !== 'string') {
          logger.warn('Validation failed: Type parameter must be a string.');
          return res.status(400).json({ error: 'Type parameter must be a string' });
      }
      const validTypes = ['movie', 'series', 'episode'];
      if (!validTypes.includes(type.toLowerCase())) {
        logger.warn(`Validation failed: Invalid type parameter: ${type}`);
        return res.status(400).json({ error: 'Type must be one of: movie, series, episode' });
      }
  }

  // Validate year parameter if provided
  if (year !== undefined) {
    if (typeof year !== 'string') {
      logger.warn('Validation failed: Year parameter must be a string.');
      return res.status(400).json({ error: 'Year must be a string' });
    }
    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(year)) {
      logger.warn(`Validation failed: Invalid year format: ${year}`);
      return res.status(400).json({ error: 'Year must be a valid 4-digit year (e.g., 2024)' });
    }
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
        logger.warn(`Validation failed: Year could not be parsed as integer: ${year}`);
        return res.status(400).json({ error: 'Year must be a valid number'});
    }
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear + 5) {
      logger.warn(`Validation failed: Year out of range: ${yearNum}`);
      return res.status(400).json({ error: `Year must be between 1900 and ${currentYear + 5}` });
    }
  }

  // Validate page parameter if provided
  if (page !== undefined) {
    if (typeof page !== 'string') {
        logger.warn('Validation failed: Page parameter must be a string.');
        return res.status(400).json({ error: 'Page parameter must be a string' });
    }
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
      logger.warn(`Validation failed: Invalid page number: ${page}`);
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    // Optional: Convert page in req.query to number if controllers expect it
    // req.query.page = pageNum;
  }

  // If all validations pass
  logger.debug('Search parameters validated successfully.');
  next();
}

/**
 * Validate ID parameter middleware
 * - id: required, string, must be a valid IMDB ID format (starts with 'tt' followed by numbers)
 */
export function validateIdParam(req, res, next) {
  const { id } = req.params;

  // Check if ID exists
  if (!id || typeof id !== 'string') {
    logger.warn('Validation failed: Missing or invalid ID parameter.');
    return res.status(400).json({ error: 'Media ID (string) is required in URL path' });
  }

  // Validate IMDB ID format
  const imdbIdRegex = /^tt\d+$/;
  if (!imdbIdRegex.test(id)) {
    logger.warn(`Validation failed: Invalid IMDB ID format: ${id}`);
    return res.status(400).json({ error: 'Invalid ID format. Must be a valid IMDB ID (e.g., tt1234567)' });
  }

  // If validation passes
  logger.debug(`ID parameter validated successfully: ${id}`);
  next();
} 