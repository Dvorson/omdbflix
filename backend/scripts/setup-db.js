#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Ensure .env is loaded
const bcrypt = require('bcryptjs'); // Need bcrypt for sample data

// Database directory and file
const dbDirectory = path.resolve(__dirname, '../data');
const dbPath = path.join(dbDirectory, 'movie_explorer.db');

console.log('--- Database Setup Script ---');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDirectory)) {
  console.log(`Creating database directory: ${dbDirectory}`);
  fs.mkdirSync(dbDirectory, { recursive: true });
} else {
  console.log(`Database directory already exists: ${dbDirectory}`);
}

console.log(`Ensuring SQLite database exists at: ${dbPath}`);

// Initialize database (creates file if it doesn't exist)
const db = new Database(dbPath);
console.log('Database connection established.');

// Enable WAL mode and foreign keys (run every time)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Check if tables already exist to avoid errors on subsequent runs
const checkTableExists = (tableName) => {
  const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
  return !!result;
};

// Create tables if they don't exist
console.log('Creating tables (if they dont exist)...');

// Users table
if (!checkTableExists('users')) {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Required for local auth
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  - Created \'users\' table');

  // Trigger to update the updated_at timestamp for users
  db.exec(`
    CREATE TRIGGER update_users_timestamp
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END
  `);
  console.log('  - Created trigger for users updated_at');

  // Create indexes for faster lookup
  console.log('  - Creating indexes for users...');
  db.exec('CREATE INDEX idx_users_email ON users (email)');

} else {
   console.log('  - Table \'users\' already exists, skipping creation.');
}

// Favorites table
if (!checkTableExists('favorites')) {
  db.exec(`
    CREATE TABLE favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, movie_id)
    )
  `);
  console.log('  - Created \'favorites\' table');

  // Create indexes for faster lookup
  console.log('  - Creating indexes for favorites...');
  db.exec('CREATE INDEX idx_favorites_user_id ON favorites (user_id)');
  db.exec('CREATE INDEX idx_favorites_movie_id ON favorites (movie_id)');
} else {
  console.log('  - Table \'favorites\' already exists, skipping creation.');
}

// Insert sample data for development (only if users table is empty)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (process.env.NODE_ENV !== 'production' && userCount === 0) {
  console.log('Adding sample data for development...');
  
  // Sample bcrypt hash for password "password123"
  const salt = bcrypt.genSaltSync(10);
  const bcryptHash = bcrypt.hashSync('password123', salt);
  
  // Add a test user
  try {
    const insertUser = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
    const userResult = insertUser.run('test@example.com', bcryptHash, 'Test User');
    const userId = userResult.lastInsertRowid;
    console.log(`    - Added test user (ID: ${userId})`);

    // Add sample favorites for test user
    if (userId) {
      const insertFavorite = db.prepare('INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)');
      insertFavorite.run(userId, 'tt0111161'); // The Shawshank Redemption
      insertFavorite.run(userId, 'tt0068646'); // The Godfather
      insertFavorite.run(userId, 'tt0071562'); // The Godfather: Part II
      console.log(`    - Added sample favorites for user ID: ${userId}`);
    }
  } catch (error) {
     console.error('    - Error adding sample data:', error);
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.log('Skipping sample data insertion (users table not empty or production environment).');
}

// Close the database connection
db.close();

console.log('Database setup script completed successfully!');
console.log('-------------------------------'); 