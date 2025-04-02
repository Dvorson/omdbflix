import path from 'path';
import Database from 'better-sqlite3';
import { logger } from './logger';

const dbPath = path.resolve(__dirname, '../../data/movie_explorer.db');
let db: any; // Using any temporarily

export function initDatabase() {
  try {
    if (!require('fs').existsSync(path.dirname(dbPath))) {
      logger.warn(`Database directory ${path.dirname(dbPath)} does not exist. Run setup script first.`);
      return; 
    }
    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? logger.debug : undefined });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    logger.info(`SQLite database connected at ${dbPath}`);
  } catch (error) {
    logger.error('SQLite database initialization error:', error);
    process.exit(1);
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    logger.info('SQLite database connection closed');
  }
} 