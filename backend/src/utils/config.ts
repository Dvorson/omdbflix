import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define the expected structure of your configuration
interface AppConfig {
  port: string | number;
  nodeEnv: string;
  omdbApiKey: string | undefined;
  omdbApiUrl: string;
  redisUrl: string | undefined; // Added for Redis cache
  jwtSecret: string;
  sessionSecret: string;
  // Removed OAuth variables
  frontendURL: string; 
}

// Load and export configuration
export const config: AppConfig = {
  port: process.env.BACKEND_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  omdbApiKey: process.env.OMDB_API_KEY,
  omdbApiUrl: process.env.OMDB_API_URL || 'http://www.omdbapi.com',
  redisUrl: process.env.REDIS_URL, // e.g., redis://localhost:6379
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me', 
  sessionSecret: process.env.SESSION_SECRET || 'default_session_secret_change_me',
  // Removed OAuth variables
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Validate essential configuration
export function validateConfig(): void {
  // Skip validation in test mode
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Removed OAuth variables from required list
  const requiredConfig: (keyof AppConfig)[] = [
    'omdbApiKey',
    'jwtSecret',
    'sessionSecret',
    'frontendURL'
  ];

  const missingConfig = requiredConfig.filter(key => !config[key] || config[key] === 'default_jwt_secret_change_me' || config[key] === 'default_session_secret_change_me');

  if (missingConfig.length > 0) {
    console.error(`
      FATAL ERROR: Missing or default configuration variables: ${missingConfig.join(', ')}
      Please check your .env file or environment variables.
      Exiting...
    `);
    process.exit(1);
  }
  
  // Warn about default secrets if not in production
  if (config.nodeEnv !== 'production') {
      if (config.jwtSecret === 'default_jwt_secret_change_me') {
          console.warn('WARNING: Using default JWT_SECRET. Please set a secure secret in .env for development.');
      }
      if (config.sessionSecret === 'default_session_secret_change_me') {
          console.warn('WARNING: Using default SESSION_SECRET. Please set a secure secret in .env for development.');
      }
  }
} 