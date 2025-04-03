import { searchMedia, getMediaById, MediaServiceError } from '../services/mediaService.js';
import { logger } from '../utils/logger.js';
// Note: The specific year validation logic is now within the service, middleware handles format.

/**
 * Controller for handling media search requests
 * Assumes query parameters have been basic validated by middleware
 */
export async function searchMediaController(req, res) {
  try {
    // Extract search parameters from query
    // Ensure page is parsed as integer, default to 1
    let page = req.query.page ? parseInt(req.query.page, 10) : 1;
    if (isNaN(page) || page < 1) {
        logger.warn('Invalid page number received in controller after validation, defaulting to 1.');
        page = 1; // Default or handle error more strictly if needed
    }

    const searchParams = {
      query: req.query.query,
      type: req.query.type,
      year: req.query.year,
      page: page,
    };

    logger.debug('Executing searchMediaController with params:', searchParams);

    // Call service with validated parameters
    const result = await searchMedia(searchParams);

    // Send the result from the service
    return res.json(result);

  } catch (error) {
    logger.error('Error in searchMediaController:', error);

    // Handle errors specifically from MediaServiceError
    if (error instanceof MediaServiceError) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }

    // Generic fallback for unexpected errors
    return res.status(500).json({ error: 'An unexpected error occurred while searching media.' });
  }
}

/**
 * Controller for getting media details by ID
 * Assumes ID parameter has been validated by middleware
 */
export async function getMediaByIdController(req, res) {
  try {
    const { id } = req.params;
    logger.debug(`Executing getMediaByIdController for ID: ${id}`);

    // Get media details from service
    const result = await getMediaById(id);

    // Send the result
    return res.json(result);

  } catch (error) {
    logger.error(`Error in getMediaByIdController for ID ${req.params.id}:`, error);

    // Handle errors specifically from MediaServiceError (e.g., 404 Not Found)
    if (error instanceof MediaServiceError) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }

    // Generic fallback for unexpected errors
    return res.status(500).json({ error: 'An unexpected error occurred while fetching media details.' });
  }
} 