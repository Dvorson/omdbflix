import { Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { getDb } from '../utils/db';

// Get user favorites
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
      return;
    }

    const favorites = await fetchFavoritesFromDb(userId);
    
    res.json({
      success: true,
      favorites
    });
  } catch (error) {
    logger.error('Error getting favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites'
    });
  }
};

// Add movie to favorites
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
      return;
    }
    
    if (!movieId) {
      res.status(400).json({
        success: false,
        message: 'Movie ID is required'
      });
      return;
    }
    
    const success = await addFavoriteToDb(userId, movieId);
    
    if (!success) {
      res.status(500).json({
        success: false,
        message: 'Failed to add movie to favorites'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Movie added to favorites'
    });
  } catch (error) {
    logger.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding favorite'
    });
  }
};

// Remove movie from favorites
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
      return;
    }
    
    if (!movieId) {
      res.status(400).json({
        success: false,
        message: 'Movie ID is required'
      });
      return;
    }
    
    const success = await removeFavoriteFromDb(userId, movieId);
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Movie not in favorites or could not be removed'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Movie removed from favorites'
    });
  } catch (error) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
};

// --- Placeholder DB functions (These should interact with getDb() from utils/db.ts) ---
async function fetchFavoritesFromDb(userId: number): Promise<string[]> {
    const db = getDb();
    const rows = db.prepare('SELECT movie_id FROM favorites WHERE user_id = ?').all(userId) as { movie_id: string }[];
    return rows.map(r => r.movie_id);
}

async function addFavoriteToDb(userId: number, movieId: string): Promise<boolean> {
    const db = getDb();
    try {
        const sql = 'INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)';
        db.prepare(sql).run(userId, movieId);
        return true;
    } catch (error: any) {
        // Handle potential UNIQUE constraint violation (already favorited)
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            logger.warn(`Attempted to add duplicate favorite ${movieId} for user ${userId}`);
            // Depending on desired behavior, could return true (idempotent) or false/throw
            return true; // Treat as success if already exists
        }
        logger.error(`DB error adding favorite ${movieId} for user ${userId}:`, error);
        return false;
    }
}

async function removeFavoriteFromDb(userId: number, movieId: string): Promise<boolean> {
    const db = getDb();
    try {
        const sql = 'DELETE FROM favorites WHERE user_id = ? AND movie_id = ?';
        const result = db.prepare(sql).run(userId, movieId);
        return result.changes > 0;
    } catch (error) {
        logger.error(`DB error removing favorite ${movieId} for user ${userId}:`, error);
        return false;
    }
}

// --- End Placeholder DB functions --- 