import app from './app.js';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { closeDatabase } from './utils/db.js';
// Import cache (assuming it will be created as .js)
import { closeCache } from './services/cache.js';

// Ensure PORT is a number and set to 5000 explicitly
// (Note: config.port might be loaded from .env, ensure consistency)
const PORT = parseInt(String(config.port), 10) || 5000;
// Use HOST from the config
const HOST = config.host;

// Listen on all network interfaces (0.0.0.0) to be accessible inside Docker/containers
const server = app.listen(PORT, HOST, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  logger.info(`Server bound to ${HOST} - http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  logger.info(`Health endpoint available at: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health`);
  logger.info(`API Health endpoint available at: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
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

// Handle SIGTERM signal for graceful shutdown (e.g., in Docker/K8s)
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    await closeDatabase();
    await closeCache();
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

export default server; 