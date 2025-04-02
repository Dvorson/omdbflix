import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
      return;
    }

    // Create new user
    const newUser = await UserModel.create({
      email,
      password,
      name
    });

    if (!newUser) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create user' 
      });
      return;
    }
    
    // Generate token
    const token = UserModel.generateAuthToken(newUser.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    logger.error('Error in user registration:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }

    // Check password
    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }

    // Generate token
    const token = UserModel.generateAuthToken(user.id);

    // Get favorites
    const favorites = UserModel.getFavorites(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        favorites
      }
    });
  } catch (error) {
    logger.error('Error in user login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
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

    // Get favorites
    const favorites = UserModel.getFavorites(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        favorites
      }
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching user data' 
    });
  }
}; 