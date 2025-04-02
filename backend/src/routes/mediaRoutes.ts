import { Router } from 'express';
import { searchMediaController, getMediaByIdController } from '../controllers/mediaController';
import { validateSearchParams, validateIdParam } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/media/search
 * @desc    Search for media by title with optional filters
 * @access  Public
 */
router.get('/search', validateSearchParams, searchMediaController);

/**
 * @route   GET /api/media/test-year
 * @desc    Test endpoint for year parameter validation
 * @access  Public
 */
router.get('/test-year', (req, res) => {
  try {
    const { year } = req.query;
    
    // Log detailed information about the year parameter
    logger.info('Year parameter debug:', {
      value: year,
      type: typeof year,
      isArray: Array.isArray(year),
      toString: year?.toString(),
      isNumeric: /^\d+$/.test(year as string)
    });
    
    // Simple SQL test
    if (year && typeof year === 'string') {
      try {
        // Simulate a conversion to number like SQL would do
        const numericYear = parseInt(year, 10);
        if (isNaN(numericYear)) {
          throw new Error('Cannot convert to number');
        }
        return res.json({ 
          status: 'success', 
          message: 'Year parameter is valid for SQL conversion',
          year,
          numericYear
        });
      } catch (error: any) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Year parameter would cause SQL conversion error',
          year,
          error: error.message
        });
      }
    }
    
    return res.json({ 
      status: 'warning', 
      message: 'No year parameter provided or invalid type',
      year
    });
  } catch (error: any) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error testing year parameter',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/media/:id
 * @desc    Get detailed information about a specific media item
 * @access  Public
 */
router.get('/:id', validateIdParam, getMediaByIdController);

export default router; 