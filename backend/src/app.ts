import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { config, validateConfig } from './utils/config';
import mediaRoutes from './routes/mediaRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { initDatabase } from './utils/db';
import { initializeCache } from './services/cache';
import configurePassport from './config/passport';
import { logger } from './utils/logger';

// Validate required environment variables
validateConfig();

// Initialize Database first
initDatabase();

// Initialize Redis cache (potentially used for session store later)
initializeCache();

// Configure Passport strategies
configurePassport();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Session Middleware (before Passport)
// TODO: Replace MemoryStore with a persistent store like connect-redis for production
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false, // Don't save sessions until something is stored
  cookie: {
    secure: config.nodeEnv === 'production', // Use secure cookies in production (requires HTTPS)
    httpOnly: true, // Prevent client-side JS access
    maxAge: 1000 * 60 * 60 * 24 * 7 // Example: 7 days
  },
  // store: // Add a persistent store here (e.g., RedisStore)
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Log session store warning if in production and using default MemoryStore
if (config.nodeEnv === 'production' && app.get('trust proxy') !== true) {
    // Accessing session store type is complex, use logger warning as indication
    logger.warn('Using default MemoryStore for sessions in production. This is not suitable for multi-instance deployments and will cause memory leaks. Configure a persistent session store (e.g., connect-redis).');
}

// Log requests in development mode
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app; 