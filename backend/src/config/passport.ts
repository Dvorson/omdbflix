import passport from 'passport';
import { Strategy as LocalStrategy, VerifyFunction as LocalVerifyFunction } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions as JwtStrategyOptions } from 'passport-jwt';
import { User } from '../models/User';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// Type for JWT payload
interface JwtPayload {
  id: number;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

export default function configurePassport() {

  // --- Local Strategy (Email/Password Login) ---
  const localVerify: LocalVerifyFunction = async (email, password, done) => {
      try {
        const user = await User.findByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        if (!user.password) {
          // User exists but registered via OAuth, no local password set
          return done(null, false, { message: 'Please log in using your original method (e.g., Google or GitHub).' });
        }
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        // Password hash should not be included in the user object passed to `done` typically
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        return done(null, userWithoutPassword as Express.User); // Cast to Express.User
      } catch (error) {
        logger.error('Error in LocalStrategy:', error);
        return done(error);
      }
    }
  passport.use(new LocalStrategy({ usernameField: 'email' }, localVerify));

  // --- JWT Strategy (For authenticating API requests) ---
  const jwtOptions: JwtStrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret, // Type should be string | Buffer, string is fine
  };

  // Use imported JwtVerifyCallback
  passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      // Payload structure checked via JwtPayload interface
      if (!payload || typeof payload.id !== 'number') {
          // Use the correct signature for JwtVerifyCallback: done(err, user, info)
          return done(null, false, { message: 'Invalid token payload' }); 
      }
      const user = await User.findById(payload.id);
      if (user) {
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        // User object is valid for the callback
        return done(null, userWithoutPassword); 
      } else {
        // User not found, valid callback usage
        return done(null, false, { message: 'User not found' }); 
      }
    } catch (error) {
      logger.error('Error in JwtStrategy:', error);
      return done(error, false);
    }
  }));

  // --- Session Management (Serialization/Deserialization) ---
  passport.serializeUser((user: Express.User, done) => { 
    // Assume Express.User has an `id` property (common practice)
    // You might need to extend the Express.User interface globally if `id` isn't standard
    const userWithId = user as Express.User & { id: number };
    if (userWithId && typeof userWithId.id === 'number') {
        done(null, userWithId.id);
    } else {
        done(new Error('User object missing ID during serialization'));
    }
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await User.findById(id);
      if (user) {
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        // Pass the found user object (without password)
        done(null, userWithoutPassword as Express.User); // Cast to Express.User
      } else {
        // User not found, pass false for user parameter
        done(null, false); 
      }
    } catch (error) {
      done(error);
    }
  });

  logger.info('Passport strategies (Local, JWT) configured.');
} 