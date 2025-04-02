import { Request, Response, NextFunction } from 'express';

/**
 * Validate search parameters
 * - query: required, string
 * - type: optional, one of 'movie', 'series', 'episode', or undefined
 * - year: optional, should be a valid year format (YYYY)
 * - page: optional, should be a positive integer
 */
export function validateSearchParams(req: Request, res: Response, next: NextFunction) {
  const { query, type, year, page } = req.query;
  
  // Validate query parameter (required)
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  // Validate type parameter if provided
  if (type !== undefined && typeof type === 'string') {
    const validTypes = ['movie', 'series', 'episode'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Type must be one of: movie, series, episode' 
      });
    }
  }
  
  // Validate year parameter if provided
  if (year !== undefined && typeof year === 'string') {
    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(year) || parseInt(year, 10) < 1900 || parseInt(year, 10) > new Date().getFullYear() + 5) {
      return res.status(400).json({ 
        error: 'Year must be a valid 4-digit year between 1900 and current year + 5' 
      });
    }
  }
  
  // Validate page parameter if provided
  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    
    // Convert page to number for easier handling in controller
    req.query.page = pageNum.toString();
  }
  
  next();
}

/**
 * Validate ID parameter
 * - id: required, string, must be a valid IMDB ID format (starts with 'tt' followed by numbers)
 */
export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  
  // Check if ID exists
  if (!id) {
    return res.status(400).json({ error: 'Media ID is required' });
  }
  
  // Validate IMDB ID format
  const imdbIdRegex = /^tt\d+$/;
  if (!imdbIdRegex.test(id)) {
    return res.status(400).json({ 
      error: 'Invalid ID format. Must be a valid IMDB ID (e.g., tt1234567)' 
    });
  }
  
  next();
} 