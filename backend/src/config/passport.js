import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/User.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

console.log('>>> Loading module: config/passport.js');

export default function configurePassport() {

  // --- Local Strategy (Email/Password Login) ---
  passport.use(new LocalStrategy(
    { usernameField: 'email' }, // Use email as the username field
    async (email, password, done) => {
      try {
        // Find user by email, expecting password hash included
        const user = await User.findByEmailWithPassword(email);
        if (!user) {
          logger.warn(`Local strategy: Login attempt failed for non-existent email: ${email}`);
          return done(null, false, { message: 'Incorrect email or password.' }); // Generic message
        }
        if (!user.password) {
          logger.warn(`Local strategy: User ${email} exists but has no password (likely external auth).`);
          return done(null, false, { message: 'Account exists but requires a different login method.' });
        }

        // Compare password
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
          logger.warn(`Local strategy: Incorrect password for email: ${email}`);
          return done(null, false, { message: 'Incorrect email or password.' }); // Generic message
        }

        // Success: Return user object (without password)
        logger.info(`Local strategy: User ${email} (ID: ${user.id}) authenticated successfully.`);
        // Create a copy without the password hash, matching JWT strategy approach
        const { ...userWithoutPassword } = user.toObject ? user.toObject() : user;
        delete userWithoutPassword.password;
        return done(null, userWithoutPassword);

      } catch (error) {
        logger.error('Error in LocalStrategy verify function:', error);
        return done(error); // Pass internal errors to Passport
      }
    }
  ));

  // --- JWT Strategy (For authenticating API requests) ---
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
  };

  if (!config.jwtSecret || config.jwtSecret === 'default_jwt_secret_change_me') {
    logger.error('FATAL: JWT_SECRET is not configured or is set to default. Cannot securely set up JWT Strategy.');
    // return; // Don't configure JWT strategy if secret is missing/default
  }

  passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      if (!payload || typeof payload.id !== 'number') {
          logger.warn('JWT strategy: Invalid token payload received.', payload);
          return done(null, false, { message: 'Invalid token payload' });
      }

      const user = await User.findById(payload.id);
      if (user) {
        // Attach user object without the password hash to the request
        const { ...userWithoutPassword } = user.toObject();
        delete userWithoutPassword.password;
        return done(null, userWithoutPassword);
      } else {
        logger.warn(`JWT strategy: User ID ${payload.id} from token not found in database.`);
        return done(null, false, { message: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Error in JWT strategy verify function:', error);
      return done(error);
    }
  }));

  // --- Session Management (Serialization/Deserialization) ---
  // These are needed if using Express sessions alongside Passport (even if JWT is primary for API)

  passport.serializeUser((user, done) => {
    // Serialize user ID into the session
    if (user && typeof user.id === 'number') {
        done(null, user.id);
    } else {
        logger.error('Serialization failed: User object missing ID.', user);
        done(new Error('User object missing ID during serialization'));
    }
  });

  passport.deserializeUser(async (id, done) => {
    // Deserialize user from ID stored in session
    try {
      if (typeof id !== 'number') {
        logger.error(`Deserialization failed: Invalid ID type in session: ${id}`);
        return done(new Error('Invalid ID in session'));
      }
      const user = await User.findById(id);
      if (user) {
        done(null, user); // Pass user object (already excludes password)
      } else {
        logger.warn(`Deserialization failed: User with ID ${id} not found.`);
        done(null, false); // User not found
      }
    } catch (error) {
      logger.error(`Error during deserialization for user ID ${id}:`, error);
      done(error); // Pass DB or other errors
    }
  });

  logger.info('Passport strategies (Local, JWT) configured.');
}