import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

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

    const user = UserModel.findById(Number(userId));
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const favorites = UserModel.getFavorites(user.id);
    
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
    
    const user = UserModel.findById(Number(userId));
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Get current favorites to check if movie already in favorites
    const currentFavorites = UserModel.getFavorites(user.id);
    if (currentFavorites.includes(movieId)) {
      res.status(400).json({
        success: false,
        message: 'Movie already in favorites'
      });
      return;
    }
    
    // Add to favorites
    const success = UserModel.addFavorite(user.id, movieId);
    if (!success) {
      res.status(500).json({
        success: false,
        message: 'Failed to add movie to favorites'
      });
      return;
    }
    
    // Get updated favorites list
    const favorites = UserModel.getFavorites(user.id);
    
    res.json({
      success: true,
      message: 'Movie added to favorites',
      favorites
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
    
    const user = UserModel.findById(Number(userId));
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Remove from favorites
    const success = UserModel.removeFavorite(user.id, movieId);
    if (!success) {
      res.status(400).json({
        success: false,
        message: 'Movie not in favorites or could not be removed'
      });
      return;
    }
    
    // Get updated favorites list
    const favorites = UserModel.getFavorites(user.id);
    
    res.json({
      success: true,
      message: 'Movie removed from favorites',
      favorites
    });
  } catch (error) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
}; 