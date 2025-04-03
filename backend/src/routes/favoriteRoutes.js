import { Router } from 'express';
import passport from 'passport';
import { getDb } from '../utils/db.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware to protect all favorite routes using JWT strategy
// Ensures req.user is populated if token is valid
const requireAuth = passport.authenticate('jwt', { session: false });

// GET /api/favorites - Get all favorite movie IDs for the logged-in user
router.get('/', requireAuth, async (req, res, next) => {
  // req.user is populated by passport.authenticate('jwt', ...)
  const userId = req.user?.id;

  if (!userId) {
    // Should not happen if requireAuth works, but good practice
    logger.warn('Favorites GET route accessed without authenticated user ID after requireAuth.');
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const db = getDb();
    // Select only the movie_id
    const favorites = db.prepare('SELECT movie_id FROM favorites WHERE user_id = ?').all(userId);

    // Return just the array of movie IDs
    const movieIds = favorites.map((fav) => fav.movie_id);
    logger.debug(`Fetched ${movieIds.length} favorite IDs for user ${userId}.`);
    res.json(movieIds);

  } catch (error) {
    logger.error(`Error fetching favorites for user ${userId}:`, error);
    // Pass error to the general error handler
    next(error);
  }
});

// POST /api/favorites - Add a movie to favorites
router.post('/', requireAuth, async (req, res, next) => {
  const userId = req.user?.id;
  const { movieId } = req.body;

  if (!userId) {
    logger.warn('Favorites POST route accessed without authenticated user ID after requireAuth.');
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (!movieId || typeof movieId !== 'string') {
    logger.warn(`Attempt to add favorite with invalid movieId: ${movieId} for user ${userId}.`);
    return res.status(400).json({ message: 'movieId (string) is required in the request body.' });
  }

  try {
    const db = getDb();
    const sql = 'INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)';
    // Use run() which returns info about the execution
    db.prepare(sql).run(userId, movieId);

    logger.info(`Added favorite ${movieId} for user ${userId}.`);
    // Respond with success and the added movie ID
    res.status(201).json({ message: 'Favorite added successfully.', movieId });

  } catch (error) {
    // Handle potential UNIQUE constraint violation (already favorited)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      logger.warn(`Attempted to add duplicate favorite ${movieId} for user ${userId}.`);
      // Conflict status code
      return res.status(409).json({ message: 'Movie already in favorites.' });
    }
    // Handle other DB errors
    logger.error(`Error adding favorite ${movieId} for user ${userId}:`, error);
    next(error);
  }
});

// DELETE /api/favorites/:movieId - Remove a movie from favorites
router.delete('/:movieId', requireAuth, async (req, res, next) => {
  const userId = req.user?.id;
  const { movieId } = req.params; // Get movieId from URL parameters

  if (!userId) {
    logger.warn('Favorites DELETE route accessed without authenticated user ID after requireAuth.');
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (!movieId) {
    // Should be caught by router param definition, but check anyway
    logger.warn(`Attempt to delete favorite with missing movieId in URL for user ${userId}.`);
    return res.status(400).json({ message: 'movieId is required in the URL path.' });
  }

  try {
    const db = getDb();
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND movie_id = ?';
    // run() returns an info object with { changes, lastInsertRowid }
    const result = db.prepare(sql).run(userId, movieId);

    if (result.changes > 0) {
      // If changes > 0, a row was deleted
      logger.info(`Removed favorite ${movieId} for user ${userId}.`);
      res.status(200).json({ message: 'Favorite removed successfully.', movieId });
    } else {
      // If changes = 0, the movie was not in the user's favorites
      logger.warn(`Attempted to remove non-existent favorite ${movieId} for user ${userId}.`);
      res.status(404).json({ message: 'Favorite not found for this user.' });
    }
  } catch (error) {
    logger.error(`Error removing favorite ${movieId} for user ${userId}:`, error);
    next(error);
  }
});

export default router; 