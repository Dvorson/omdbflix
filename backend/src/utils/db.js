import path from 'path';
import Database from 'better-sqlite3';
import { logger } from './logger.js'; // Use .js extension
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in an ESM-compatible way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data/movie_explorer.db');
let db = null;

export function initDatabase() {
  try {
    // Use in-memory database for tests
    if (process.env.NODE_ENV === 'test') {
      db = new Database(':memory:');
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      logger.info('SQLite database connected (in-memory for tests)');
      return;
    }

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      logger.warn(`Database directory ${dataDir} does not exist. Run setup script first.`);
      // Optionally, create the directory if needed:
      // fs.mkdirSync(dataDir, { recursive: true });
      // logger.info(`Created database directory: ${dataDir}`);
      // However, it's better to rely on the setup script.
      return; // Stop if directory doesn't exist
    }

    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? logger.debug : undefined });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    logger.info(`SQLite database connected at ${dbPath}`);
  } catch (error) {
    logger.error('SQLite database initialization error:', error);
    // Don't exit process in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

export function getDb() {
  if (!db) {
    // Initialize DB if not already initialized (e.g., direct script execution)
    // initDatabase();
    // if (!db) {
        throw new Error('Database not initialized. Ensure initDatabase() is called on app startup.');
    // }
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close(); // better-sqlite3 close is synchronous, but async might be convention
    logger.info('SQLite database connection closed');
    db = null; // Reset the db variable
  }
} 