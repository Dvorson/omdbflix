import { Request, Response } from 'express';
import { searchMedia, getMediaById, MediaServiceError } from '../services/mediaService';
import { logger } from '../utils/logger';
import { validateYearParameter } from '../utils/validation';

/**
 * Controller for handling media search requests
 */
export async function searchMediaController(req: Request, res: Response) {
  try {
    // Extract search parameters from query
    const { query, type, year, page } = req.query;
    
    // Validate required parameter
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Convert page to number if provided
    const pageNumber = page ? parseInt(page as string, 10) : 1;
    
    // Validate year parameter to ensure it's a valid 4-digit year
    let validatedYear = undefined;
    if (year && typeof year === 'string') {
      if (validateYearParameter(year)) {
        validatedYear = year;
      } else {
        logger.warn(`Invalid year parameter rejected: ${year}`);
        return res.status(400).json({ error: 'Year must be a valid 4-digit year (e.g., 2024)' });
      }
    }
    
    // Call service with validated parameters
    const result = await searchMedia({
      query,
      type: type as string | undefined,
      year: validatedYear,
      page: pageNumber,
    });
    
    return res.json(result);
  } catch (error) {
    logger.error('Error in searchMediaController:', error);
    
    if (error instanceof MediaServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Controller for getting media details by ID
 */
export async function getMediaByIdController(req: Request, res: Response) {
  try {
    // Extract ID from URL parameters
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ error: 'Media ID is required' });
    }
    
    // Get media details
    const result = await getMediaById(id);
    
    return res.json(result);
  } catch (error) {
    logger.error('Error in getMediaByIdController:', error);
    
    if (error instanceof MediaServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 