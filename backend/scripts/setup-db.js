#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

// Database directory and file
const dbDirectory = path.resolve(__dirname, '../data');
const dbPath = path.join(dbDirectory, 'movie_explorer.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDirectory)) {
  console.log(`Creating database directory: ${dbDirectory}`);
  fs.mkdirSync(dbDirectory, { recursive: true });
}

console.log(`Setting up SQLite database at: ${dbPath}`);

// Recreate database file (for fresh installs or resets)
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database file...');
  fs.unlinkSync(dbPath);
}

// Initialize database
const db = new Database(dbPath);
console.log('Database created successfully');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Favorites table
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

// Create indexes for faster lookup
console.log('Creating indexes...');
db.exec('CREATE INDEX idx_users_email ON users (email)');
db.exec('CREATE INDEX idx_favorites_user_id ON favorites (user_id)');
db.exec('CREATE INDEX idx_favorites_movie_id ON favorites (movie_id)');

// Create a trigger to update the updated_at timestamp
db.exec(`
  CREATE TRIGGER update_users_timestamp
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END
`);

// Insert some sample data for development
if (process.env.NODE_ENV === 'development') {
  console.log('Adding sample data for development...');
  
  // Sample bcrypt hash for password "password123"
  const bcryptHash = '$2a$10$XcGbzwmGJ/GQ5hBxJNBL8.YbXQX6Tkl1K1G9Pgol7w4QkAR/HV3Ee';
  
  // Add a test user
  const insertUser = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
  const userResult = insertUser.run('test@example.com', bcryptHash, 'Test User');
  
  // Add sample favorites for test user
  if (userResult.lastInsertRowid) {
    const userId = userResult.lastInsertRowid;
    const insertFavorite = db.prepare('INSERT INTO favorites (user_id, movie_id) VALUES (?, ?)');
    insertFavorite.run(userId, 'tt0111161'); // The Shawshank Redemption
    insertFavorite.run(userId, 'tt0068646'); // The Godfather
    insertFavorite.run(userId, 'tt0071562'); // The Godfather: Part II
  }
}

// Close the database connection
db.close();

console.log('Database setup completed successfully!');
console.log('You can now run the application with: npm run dev'); 