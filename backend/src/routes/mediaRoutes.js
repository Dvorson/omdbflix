import { Router } from 'express';
import { searchMediaController, getMediaByIdController } from '../controllers/mediaController.js';
import { validateSearchParams, validateIdParam } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/media/search
 * @desc    Search for media by title with optional filters
 * @access  Public
 */
router.get(
    '/search',
    validateSearchParams, // Apply validation middleware first
    searchMediaController // Then the controller
);

/**
 * @route   GET /api/media/:id
 * @desc    Get detailed information about a specific media item
 * @access  Public
 */
router.get(
    '/:id',
    validateIdParam, // Apply validation middleware first
    getMediaByIdController // Then the controller
);

// Removed the /test-year route as it seemed like a debug route

export default router; 