import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { getDb } from '../utils/db';
import { logger } from '../utils/logger';
import { getMediaById } from '../services/mediaService'; // To potentially fetch details if needed

const router = Router();

// Middleware to protect all favorite routes
const requireAuth = passport.authenticate('jwt', { session: false });

// GET /api/favorites - Get all favorites for the logged-in user
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as any)?.id; // Get user ID from authenticated request
  if (!userId) {
    // This shouldn't happen if requireAuth middleware works, but good practice
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const db = getDb();
    // Select only the movie_id for now
    const favorites: { movie_id: string }[] = db.prepare('SELECT movie_id FROM favorites WHERE user_id = ?').all(userId) as { movie_id: string }[];
    
    // Optional: If you want to return full movie details, you'd fetch them here
    // const detailedFavorites = await Promise.all(favorites.map(async (fav: { movie_id: string }) => getMediaById(fav.movie_id)));
    // res.json(detailedFavorites);
    
    res.json(favorites.map((fav: { movie_id: string }) => fav.movie_id)); // Return just the IDs
  } catch (error) {
    logger.error(`Error fetching favorites for user ${userId}:`, error);
    next(error);
  }
});

// POST /api/favorites - Add a movie to favorites
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as any)?.id;
  const { movieId } = req.body; // Expecting { "movieId": "tt1234567" }

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!movieId || typeof movieId !== 'string') {
    return res.status(400).json({ message: 'movieId (string) is required in the request body' });
  }

  try {
    const db = getDb();
    const sql = 'INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)';
    db.prepare(sql).run(userId, movieId);
    logger.info(`Added favorite ${movieId} for user ${userId}`);
    res.status(201).json({ message: 'Favorite added successfully', movieId });
  } catch (error: any) {
    // Handle potential UNIQUE constraint violation (already favorited)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      logger.warn(`Attempted to add duplicate favorite ${movieId} for user ${userId}`);
      return res.status(409).json({ message: 'Movie already in favorites' });
    }
    logger.error(`Error adding favorite ${movieId} for user ${userId}:`, error);
    next(error);
  }
});

// DELETE /api/favorites/:movieId - Remove a movie from favorites
router.delete('/:movieId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as any)?.id;
  const { movieId } = req.params; // Get movieId from URL parameters

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!movieId) {
    // Should be caught by router param definition, but check anyway
    return res.status(400).json({ message: 'movieId is required in the URL path' });
  }

  try {
    const db = getDb();
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND movie_id = ?';
    const result = db.prepare(sql).run(userId, movieId);

    if (result.changes > 0) {
      logger.info(`Removed favorite ${movieId} for user ${userId}`);
      res.status(200).json({ message: 'Favorite removed successfully', movieId });
    } else {
      // Movie was not in favorites for this user
      logger.warn(`Attempted to remove non-existent favorite ${movieId} for user ${userId}`);
      res.status(404).json({ message: 'Favorite not found for this user' });
    }
  } catch (error) {
    logger.error(`Error removing favorite ${movieId} for user ${userId}:`, error);
    next(error);
  }
});

export default router; 