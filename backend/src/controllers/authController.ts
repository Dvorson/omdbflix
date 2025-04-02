import { Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
      return;
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      name
    });

    if (!newUser || !newUser.id) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create user' 
      });
      return;
    }
    
    // Generate token
    const token = User.generateToken(newUser.id);

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
  logger.warn('Direct /login controller called - should likely use passport.authenticate in routes.');
  res.status(501).json({ message: 'Login via direct controller not implemented. Use passport strategy.' });
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  logger.warn('Direct /me controller called - should rely on /auth/status route which uses passport JWT strategy.');
  if (req.user) {
      res.json({ success: true, user: req.user });
  } else {
      res.status(401).json({ success: false, message: 'Not authenticated'});
  }
}; 