import app from './app';
import { config } from './utils/config';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  console.error(err.stack);
  
  // Gracefully close server & exit process
  server.close(() => process.exit(1));
});

export default server; 