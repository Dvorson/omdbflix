import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/db';
import { logger } from '../utils/logger';

// Interface for User data (adjust fields as needed)
export interface UserData {
  id?: number;
  email: string;
  password?: string; // Optional because it's hashed and might not always be present
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// SQLite error interface
interface SQLiteError extends Error {
  code?: string;
}

export class User {
  static async create(userData: UserData): Promise<UserData | null> {
    const db = getDb();
    let hashedPassword = null;

    // Hash password if provided (for local registration)
    if (userData.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(userData.password, salt);
      } catch (error) {
        logger.error('Error hashing password:', error);
        return null;
      }
    } else {
      // Password is now required for local-only auth
      logger.error('Attempted to create user without password.');
      throw new Error('Password is required for registration.');
    }

    const sql = `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`;
    
    try {
      const result = db.prepare(sql).run(
        userData.email,
        hashedPassword,
        userData.name
      );
      return this.findById(result.lastInsertRowid as number);
    } catch (error) {
      logger.error('Error creating user:', error);
      // Handle specific errors like UNIQUE constraint violation (email exists)
      const sqliteError = error as SQLiteError;
      if (sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
         throw new Error('Email already exists');
      }
      return null;
    }
  }

  static async findById(id: number): Promise<UserData | null> {
    const db = getDb();
    const sql = 'SELECT id, email, name, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?';
    try {
      const row = db.prepare(sql).get(id) as unknown as UserData | undefined;
      return row || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<UserData | null> {
    const db = getDb();
    // Use correct column names with AS for aliasing
    const sql = 'SELECT id, email, password, name, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?';
    try {
      const row = db.prepare(sql).get(email) as unknown as UserData | undefined;
      return row || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  }

  // Method to compare password for local login
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error comparing password:', error);
      return false;
    }
  }

  // Method to generate JWT token
  static generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_dev_only';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (jwtSecret === 'fallback_secret_dev_only') {
      logger.warn('Using fallback JWT secret. Set JWT_SECRET environment variable for production.');
    }

    return jwt.sign(
      { id: userId },
      jwtSecret,
      { expiresIn }
    );
  }
} 