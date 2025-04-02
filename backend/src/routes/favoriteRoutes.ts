import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/favorites - Get user favorites
router.get('/', getFavorites);

// POST /api/favorites - Add to favorites
router.post('/', addFavorite);

// DELETE /api/favorites/:movieId - Remove from favorites
router.delete('/:movieId', removeFavorite);

export default router; 