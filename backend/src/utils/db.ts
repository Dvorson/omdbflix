import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

// Database file path
const dbDirectory = path.resolve(__dirname, '../../data');
const dbPath = path.join(dbDirectory, 'movie_explorer.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

let db: Database | null = null;

export const initDatabase = (): void => {
  try {
    db = new Database(dbPath);
    logger.info(`SQLite database connected at ${dbPath}`);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create users table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create favorites table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, movie_id)
      )
    `);

    logger.info('Database tables initialized');
  } catch (error) {
    logger.error('SQLite database initialization error:', error);
    process.exit(1);
  }
};

export const getDb = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    logger.info('SQLite database connection closed');
  }
}; 