import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  omdbApiKey: process.env.OMDB_API_KEY,
  omdbApiUrl: process.env.OMDB_API_URL || 'https://www.omdbapi.com',
};

// Validate required environment variables
export const validateConfig = (): void => {
  if (!config.omdbApiKey) {
    throw new Error('OMDB_API_KEY is required');
  }
}; 