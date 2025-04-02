import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', register);

// POST /api/auth/login - Login a user
router.post('/login', login);

// GET /api/auth/me - Get current user profile (protected route)
router.get('/me', protect, getCurrentUser);

export default router; 