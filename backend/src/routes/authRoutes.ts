import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../utils/config';
import { getDb } from '../utils/db';
import { logger } from '../utils/logger';
import { AuthUser, ApiError, AuthInfo } from '@repo/types';

const router = Router();

// Generate JWT token and send it in the response
const generateAndSendToken = (user: AuthUser, res: Response) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  res.status(200).json({
    success: true,
    token: `Bearer ${token}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
};

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const db = getDb();
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const result = db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).run(name, email, hashedPassword);

    // Get the newly created user
    const newUser = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);

    logger.info(`User registered successfully: ${email} (ID: ${result.lastInsertRowid})`);

    // Generate JWT token and send response
    generateAndSendToken(newUser as unknown as AuthUser, res);
  } catch (error) {
    const err = error as ApiError;
    logger.error('Registration error:', err);
    res.status(err.status || 500).json({ 
      success: false, 
      message: err.message || 'Server error during registration'
    });
  }
});

// Login user
router.post('/login', (req: Request, res: Response) => {
  passport.authenticate('local', { session: false }, (err: Error | null, user: Express.User | false, info: AuthInfo) => {
    if (err) {
      logger.error('Login error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
    
    if (!user) {
      logger.warn(`Login failed: ${info?.message || 'No user returned'}`);
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid credentials' 
      });
    }

    logger.info(`Login successful for user ID: ${(user as AuthUser).id}`);
    // Generate JWT token and send response
    generateAndSendToken(user as AuthUser, res);
  })(req, res);
});

// Logout route
// Note: JWT logout is primarily client-side (remove token)
router.get('/logout', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

// === Authentication Status & Logout ===

// 7. Get Current User Status (Protected by JWT)
router.get('/status', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  // If JWT authentication is successful, req.user contains the user payload
  res.json({ isAuthenticated: true, user: req.user });
});

export default router; 