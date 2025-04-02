import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './utils/config';
import mediaRoutes from './routes/mediaRoutes';
import authRoutes from './routes/authRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { initDatabase } from './utils/db';
import { initializeCache } from './services/cache';

// Validate required environment variables
validateConfig();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

// Initialize Redis cache
initializeCache();

// Log requests in development mode
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
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