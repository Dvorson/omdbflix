import app from './app.js';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { closeDatabase } from './utils/db.js';
// Import cache (assuming it will be created as .js)
import { closeCache } from './services/cache.js';

// Ensure PORT is a number and set to 5000 explicitly
// (Note: config.port might be loaded from .env, ensure consistency)
const PORT = parseInt(config.port, 10) || 5000;

// Listen on all network interfaces (0.0.0.0) to be accessible inside Docker/containers
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(async () => {
    await closeDatabase();
    await closeCache(); // TODO: Implement and uncomment
    process.exit(1);
  });
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    logger.info(`${signal} received. Shutting down gracefully`);
    server.close(async () => {
      await closeDatabase();
      await closeCache(); // TODO: Implement and uncomment
      logger.info('Process terminated');
      process.exit(0);
    });
}

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server; 