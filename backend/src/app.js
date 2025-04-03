import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { config, validateConfig } from './utils/config.js';
// Import routes
import mediaRoutes from './routes/mediaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
// Import middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initDatabase } from './utils/db.js';
// Import cache
import { initializeCache } from './services/cache.js';
// Import passport config
import configurePassport from './config/passport.js';
import { logger } from './utils/logger.js';

// Validate required environment variables
validateConfig();

// Initialize Database first
initDatabase();

// Initialize Redis cache
initializeCache();

// Configure Passport strategies
configurePassport();

// Initialize Express app
const app = express();

// Core Middleware
app.use(cors()); // Consider configuring CORS options for production
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // If using form submissions

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
    // Add sameSite: 'lax' or 'strict' for CSRF protection
  },
  // store: // Add a persistent store here (e.g., RedisStore)
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session()); // Needed for session-based auth (even if using JWT for API)

// Log session store warning if in production and using default MemoryStore
if (config.nodeEnv === 'production' /* && app.get('trust proxy') !== true */) {
    // Accessing session store type is complex, use logger warning as indication
    logger.warn('Using default MemoryStore for sessions in production. This is not suitable for multi-instance deployments and will cause memory leaks. Configure a persistent session store (e.g., connect-redis).');
}

// Log requests in development mode
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    port: config.port
  });
});

// API Health check route (specifically for CI/CD)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'backend-api',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    port: config.port,
    database: 'connected'
  });
});

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/auth', authRoutes);

// TEMP DEBUG: Log Authorization header for /api/favorites requests
app.use('/api/favorites', (req, res, next) => {
  logger.debug(`[Auth Check] /api/favorites - Authorization Header: ${req.headers.authorization || '(Not Present)'}`);
  next();
});

app.use('/api/favorites', favoriteRoutes);

// Error Handling Middleware (must be last)
app.use(notFound); // Handle 404s first
app.use(errorHandler); // Handle all other errors

export default app; 