import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js'; // Import config for NODE_ENV

// Not Found (404) middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  // error.status = 404; // Optionally set a status property
  res.status(404);
  next(error); // Pass the error to the next error handler
};

// General error handling middleware
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // Determine status code: use error's status, response status, or default to 500
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode) || 500;

  // Log the error with more details
  logger.error(`Error: ${err.message}`, {
      status: statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: config.nodeEnv !== 'production' ? err.stack : undefined // Only log stack in dev
  });

  // Send error response
  res.status(statusCode).json({
    error: {
        message: err.message || 'An unexpected error occurred',
        // Include stack trace in development only for debugging
        ...(config.nodeEnv !== 'production' && { stack: err.stack })
    }
  });
}; 