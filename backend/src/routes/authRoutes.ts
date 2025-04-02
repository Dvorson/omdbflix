import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

// --- Helper to generate JWT --- 
// (Could also be in a separate utility file)
function generateAndSendToken(user: Express.User, res: Response) {
    const token = User.generateToken((user as any).id); // Assuming user object has id
    res.json({ 
        message: "Authentication successful", 
        token: token, 
        user: {
            id: (user as any).id,
            name: (user as any).name,
            email: (user as any).email
            // Add other non-sensitive fields as needed
        }
    });
}

// === Local Authentication Routes ===

// 5. Register New User (Local)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields: email, password, name' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Create user (password hashing is handled in User.create)
    const newUser = await User.create({ email, password, name });
    
    if (!newUser) {
        throw new Error('User creation failed unexpectedly after check.');
    }

    logger.info(`User registered successfully: ${newUser.email} (ID: ${newUser.id})`);
    
    // Optionally log the user in immediately and send token
    generateAndSendToken(newUser as Express.User, res);

  } catch (error: any) {
    logger.error('Error during registration:', error);
    // Handle specific errors like validation or db constraint
    if (error.message === 'Email already exists') {
        return res.status(409).json({ message: 'Email already in use' });
    }
    next(error); // Pass other errors to the global error handler
  }
});

// 6. Login User (Local)
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', { session: false }, (err: any, user: Express.User | false, info: any) => {
        if (err) {
            logger.error('Local login error:', err);
            return next(err);
        }
        if (!user) {
            // Authentication failed (incorrect email/password or other issue)
            logger.warn(`Local login failed: ${info?.message || 'No user returned'}`);
            return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }
        // Authentication successful
        logger.info(`Local login successful for user: ${(user as any).email}`);
        generateAndSendToken(user, res);
    })(req, res, next); // Important: call the middleware function
});

// === Authentication Status & Logout ===

// 7. Get Current User Status (Protected by JWT)
router.get('/status', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  // If JWT authentication is successful, req.user contains the user payload
  res.json({ isAuthenticated: true, user: req.user });
});

// 8. Logout User
// Note: Since we are using JWT, logout is primarily handled on the client-side by deleting the token.
// This endpoint can be used for any server-side cleanup if needed (e.g., invalidating refresh tokens if implemented).
router.post('/logout', (req: Request, res: Response) => {
  // If using sessions alongside JWT (not recommended typically), you would req.logout() and destroy session here.
  res.json({ message: 'Logout successful (client should clear token)' });
});


export default router; 