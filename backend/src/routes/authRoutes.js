import { Router } from 'express';
import passport from 'passport';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Helper to generate JWT and send response
const generateAndSendToken = (user, res) => {
  try {
    // Ensure user object has necessary fields for token generation
    if (!user || !user.id || !user.email || !user.name) {
        logger.error('generateAndSendToken: Invalid user object provided.', user);
        // Avoid sending sensitive details in the error message
        return res.status(500).json({ success: false, message: 'Token generation error.' });
    }

    const token = User.generateToken(user); // Use the static method from User model
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
        // Only include non-sensitive info
      }
    });
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    res.status(500).json({ success: false, message: 'Could not generate authentication token.' });
  }
};

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    logger.warn('Registration attempt failed: Missing required fields.');
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, email, and password are required.'
    });
  }
  // Add more robust validation (e.g., email format, password strength) here if needed

  try {
    // Create user using the User model
    const newUser = await User.create({ name, email, password });

    // If creation is successful, newUser object (without password) is returned
    if (newUser) {
        logger.info(`User registered successfully: ${email} (ID: ${newUser.id})`);
        // Generate token and send response
        generateAndSendToken(newUser, res);
    } else {
        // Should not happen if User.create throws errors correctly, but handle defensively
        logger.error('Registration completed but failed to retrieve new user data.');
        res.status(500).json({ success: false, message: 'Registration failed due to an internal error.'});
    }

  } catch (error) {
    logger.error('Registration process error:', error);
    // Check for specific known errors (e.g., email exists)
    if (error.message === 'Email already exists.') {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    // Handle other potential errors (DB error, hashing error)
    res.status(500).json({ success: false, message: error.message || 'Registration failed due to an internal server error.' });
  }
});

// Login user using Passport's local strategy
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    // Handle strategy errors
    if (err) {
      logger.error('Passport local authenticate error:', err);
      return res.status(500).json({ success: false, message: 'Authentication error occurred.' });
    }
    // Handle authentication failure (incorrect credentials, etc.)
    if (!user) {
      logger.warn(`Login failed: ${info?.message || 'Invalid credentials.'}`);
      // Use the message from the strategy if available
      return res.status(401).json({ success: false, message: info?.message || 'Invalid email or password.' });
    }

    // Authentication successful, user object (without password) is available
    logger.info(`Login successful for user: ${user.email} (ID: ${user.id})`);
    generateAndSendToken(user, res);

  })(req, res, next); // Don't forget to call the middleware function
});

// Logout route (primarily client-side for JWT)
router.post('/logout', (req, res) => {
  // Server-side logout logic for JWT is minimal.
  // If using refresh tokens, blacklist the token here.
  // If using sessions alongside JWT, destroy the session: req.logout(), req.session.destroy().
  logger.info('Logout endpoint called.'); // Can log user ID if authenticated
  res.status(200).json({ success: true, message: 'Logout successful.' });
});

// Get Current User Status (Protected by JWT strategy)
router.get('/status', passport.authenticate('jwt', { session: false }), (req, res) => {
  // If JWT authentication is successful, passport attaches the user object (from JWT strategy's done callback) to req.user
  if (req.user) {
      logger.debug(`Status check for user ID: ${req.user.id}`);
      res.json({ isAuthenticated: true, user: req.user });
  } else {
      // This case should technically not be reachable if authenticate succeeds
      logger.warn('JWT authentication succeeded but req.user is not set.');
      res.status(401).json({ isAuthenticated: false, message: 'Authentication token is valid but user data could not be retrieved.'});
  }
});

export default router; 