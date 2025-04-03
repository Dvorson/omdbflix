import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js'; // Needed for JWT secret

// Simple User "model" using static methods
export class User {

  /**
   * Creates a new user in the database.
   * @param {object} userData - User data { email, password, name }
   * @returns {Promise<object|null>} The created user object (without password) or null on failure.
   * @throws {Error} If email already exists or password hashing fails.
   */
  static async create(userData) {
    const { email, password, name } = userData;
    if (!email || !password || !name) {
        throw new Error('Missing required user data (email, password, name).');
    }

    const db = getDb();
    let hashedPassword;

    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Password hashing failed.'); // Propagate error
    }

    const sql = `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`;

    try {
      const result = db.prepare(sql).run(email, hashedPassword, name);
      logger.info(`User created successfully with ID: ${result.lastInsertRowid}`);
      // Fetch and return the newly created user (without password hash)
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      logger.error('Error creating user in DB:', error);
      // Handle specific DB errors
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
         throw new Error('Email already exists.');
      }
      throw new Error('Database error during user creation.'); // Generic DB error
    }
  }

  /**
   * Finds a user by their ID.
   * @param {number} id - The user ID.
   * @returns {Promise<object|null>} User object (without password) or null if not found.
   */
  static async findById(id) {
    if (typeof id !== 'number' || id <= 0) {
        logger.warn(`Attempted to find user with invalid ID: ${id}`);
        return null;
    }
    const db = getDb();
    const sql = 'SELECT id, email, name, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?';
    try {
      const row = db.prepare(sql).get(id);
      return row || null;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw new Error('Database error finding user by ID.');
    }
  }

  /**
   * Finds a user by their email address.
   * Includes the password hash for authentication purposes.
   * @param {string} email - The user's email.
   * @returns {Promise<object|null>} User object (including password hash) or null if not found.
   */
  static async findByEmailWithPassword(email) {
     if (!email || typeof email !== 'string') {
        logger.warn(`Attempted to find user with invalid email: ${email}`);
        return null;
     }
    const db = getDb();
    const sql = 'SELECT id, email, password, name, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?';
    try {
      const row = db.prepare(sql).get(email);
      return row || null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw new Error('Database error finding user by email.');
    }
  }

  /**
   * Compares a plaintext password with a stored hash.
   * @param {string} plainPassword - The password attempt.
   * @param {string} hashedPassword - The stored hash from the database.
   * @returns {Promise<boolean>} True if passwords match, false otherwise.
   */
  static async comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
        return false; // Cannot compare if either is missing
    }
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error comparing password:', error);
      return false; // Treat comparison errors as non-match
    }
  }

  /**
   * Generates a JWT token for a user.
   * @param {object} user - User object containing at least { id, email, name }.
   * @returns {string} The generated JWT.
   * @throws {Error} If JWT secret is not configured.
   */
  static generateToken(user) {
    if (!config.jwtSecret || config.jwtSecret === 'default_jwt_secret_change_me') {
      logger.error('FATAL: JWT_SECRET is not configured or is set to default.');
      throw new Error('JWT secret is not configured securely.');
    }

    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
        // Add other relevant non-sensitive claims if needed
    };

    const expiresIn = process.env.JWT_EXPIRES_IN || '1h'; // Default expiration

    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  }
} 