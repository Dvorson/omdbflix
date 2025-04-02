import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/db';
import { logger } from '../utils/logger';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export const UserModel = {
  /**
   * Find a user by ID
   */
  findById: (id: number): User | undefined => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      return undefined;
    }
  },

  /**
   * Find a user by email
   */
  findByEmail: (email: string): User | undefined => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      return stmt.get(email.toLowerCase());
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return undefined;
    }
  },

  /**
   * Create a new user
   */
  create: async (userData: CreateUserData): Promise<User | undefined> => {
    try {
      const db = getDb();
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const stmt = db.prepare(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
      );
      
      const result = stmt.run(
        userData.email.toLowerCase(),
        hashedPassword,
        userData.name
      );
      
      if (result.lastInsertRowid) {
        const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
        return userStmt.get(result.lastInsertRowid);
      }
      
      return undefined;
    } catch (error) {
      logger.error('Error creating user:', error);
      return undefined;
    }
  },

  /**
   * Compare a password with the hashed password in the database
   */
  comparePassword: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error comparing passwords:', error);
      return false;
    }
  },

  /**
   * Generate a JWT token for a user
   */
  generateAuthToken: (userId: number): string => {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_dev_only';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(
      { id: userId },
      jwtSecret,
      { expiresIn }
    );
  },

  /**
   * Get user's favorites
   */
  getFavorites: (userId: number): string[] => {
    try {
      const db = getDb();
      const stmt = db.prepare('SELECT movie_id FROM favorites WHERE user_id = ?');
      const favorites = stmt.all(userId);
      return favorites.map((f: { movie_id: string }) => f.movie_id);
    } catch (error) {
      logger.error('Error getting user favorites:', error);
      return [];
    }
  },

  /**
   * Add a movie to favorites
   */
  addFavorite: (userId: number, movieId: string): boolean => {
    try {
      const db = getDb();
      const stmt = db.prepare('INSERT OR IGNORE INTO favorites (user_id, movie_id) VALUES (?, ?)');
      const result = stmt.run(userId, movieId);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error adding movie to favorites:', error);
      return false;
    }
  },

  /**
   * Remove a movie from favorites
   */
  removeFavorite: (userId: number, movieId: string): boolean => {
    try {
      const db = getDb();
      const stmt = db.prepare('DELETE FROM favorites WHERE user_id = ? AND movie_id = ?');
      const result = stmt.run(userId, movieId);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error removing movie from favorites:', error);
      return false;
    }
  }
}; 