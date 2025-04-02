import { Router } from 'express';
import { searchMediaController, getMediaByIdController } from '../controllers/mediaController';
import { validateSearchParams, validateIdParam } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/media/search
 * @desc    Search for media by title with optional filters
 * @access  Public
 */
router.get('/search', validateSearchParams, searchMediaController);

/**
 * @route   GET /api/media/:id
 * @desc    Get detailed information about a specific media item
 * @access  Public
 */
router.get('/:id', validateIdParam, getMediaByIdController);

export default router; 