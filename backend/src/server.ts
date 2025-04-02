import app from './app';
import { logger } from './utils/logger';
import { config } from './utils/config';
import { closeDatabase } from './utils/db';
import { closeCache } from './services/cache';

// Ensure PORT is a number and set to 5000 explicitly
const PORT = 5000;

// Listen on all network interfaces (0.0.0.0) to be accessible inside Docker/containers
// This is important for CI environments where services run in different containers
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(async () => {
    await closeDatabase();
    await closeCache();
    process.exit(1);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    await closeCache();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    await closeCache();
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default server; 