import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    // Check if auth header exists and has Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
      return;
    }

    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_dev_only';
      const decoded = jwt.verify(token, jwtSecret) as { id: number };
      
      // Find user from token
      const user = UserModel.findById(decoded.id);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
        return;
      }

      // Set user in request
      req.user = { id: user.id.toString() };
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
}; 