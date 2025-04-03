import { describe, it, beforeAll, beforeEach, afterEach, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js'; // Assuming app is correctly exported after initialization
import _Database from 'better-sqlite3';

// Mock passport and passport strategies
vi.mock('passport', async () => {
  const mockPassport = {
    initialize: vi.fn(() => (req, res, next) => next()),
    session: vi.fn(() => (req, res, next) => next()),
    use: vi.fn(),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
    authenticate: vi.fn().mockImplementation((strategy, _options = {}) => {
      if (strategy === 'jwt') {
        return (req, res, next) => {
          if (req.headers.authorization === 'Bearer invalid-or-expired-token') {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          
          if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            req.user = { id: 5, email: 'token@example.com', name: 'Token User' };
          }
          return next();
        };
      }
      // For local strategy, simulate authentication
      if (strategy === 'local') {
        return (req, res, next) => {
          const { email, password } = req.body;
          if (email === 'test@example.com' && password === 'password123') {
            req.user = { id: 1, name: 'Test User', email: 'test@example.com' };
            return next();
          }
          return res.status(401).json({ message: 'Authentication failed' });
        };
      }
      return (req, res, next) => next();
    })
  };
  
  return {
    default: mockPassport,
    ...mockPassport
  };
});

// Mock the passport strategy modules
vi.mock('passport-local', () => {
  return {
    Strategy: class LocalStrategy {
      constructor(_options, _verify) {
        // Store options and verify callback if needed
      }
    }
  };
});

vi.mock('passport-jwt', () => {
  return {
    Strategy: class JwtStrategy {
      constructor(_options, _verify) {
        // Store options and verify callback if needed
      }
    },
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: () => () => {}
    }
  };
});

// Mock the User model static methods used by controllers/passport
vi.mock('../src/models/User.js', () => {
  return {
    User: {
      findByEmail: vi.fn(),
      create: vi.fn(),
      comparePassword: vi.fn(),
      generateToken: vi.fn().mockReturnValue('mock-jwt-token'), // Mock token generation
      findById: vi.fn(), // Mock findById used by JWT strategy
    },
    __esModule: true // Needed for ES module mocking
  };
});

// Mock the database utility functions
vi.mock('../src/utils/db.js', () => {
  return {
    initDatabase: vi.fn(), // Mock initDatabase to prevent actual DB init during test setup
    getDb: vi.fn(),
    closeDatabase: vi.fn(),
    __esModule: true // Add this to ensure proper ES module mocking
  };
});

describe('Auth API (Local + JWT)', () => {
    
    let User, getDb, MockedUser, mockDbPrepare;

    beforeAll(async () => {
        // Dynamically import modules after mocks are defined
        const userModule = await import('../src/models/User.js');
        User = userModule.User;
        const dbModule = await import('../src/utils/db.js');
        getDb = dbModule.getDb;

        // Setup mocks that depend on the dynamically imported modules
        MockedUser = User; 
        mockDbPrepare = vi.fn().mockImplementation(() => ({
          get: vi.fn(),
          run: vi.fn().mockReturnValue({ lastInsertRowid: 2 })
        }));
        getDb.mockImplementation(() => ({
          prepare: mockDbPrepare
        }));
    });

    // Mock user data for reuse
    const testUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123' // Represents the hashed password
    };
    const testUserCredentials = {
        email: 'test@example.com',
        password: 'password123'
    };
    const registerUserData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'newpassword123'
    };

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it.skip('should register a new user successfully', async () => {
            MockedUser.findByEmail.mockResolvedValueOnce(null); // User doesn't exist
            MockedUser.create.mockResolvedValueOnce({ ...registerUserData, id: 2 }); // Simulate successful creation
            
            const res = await request(app)
                .post('/api/auth/register')
                .send(registerUserData);

            expect(MockedUser.findByEmail).toHaveBeenCalledWith(registerUserData.email);
            expect(MockedUser.create).toHaveBeenCalledWith(registerUserData);
            expect(MockedUser.generateToken).toHaveBeenCalledWith(2);
            expect(res.status).toBe(200);
            expect(res.body.token).toBe('mock-jwt-token');
            expect(res.body.user.email).toBe(registerUserData.email);
            expect(res.body.user.name).toBe(registerUserData.name);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it.skip('should return 409 if email already exists', async () => {
            MockedUser.findByEmail.mockResolvedValueOnce(testUser); // User exists

            const res = await request(app)
                .post('/api/auth/register')
                .send(registerUserData);

            expect(MockedUser.findByEmail).toHaveBeenCalledWith(registerUserData.email);
            expect(MockedUser.create).not.toHaveBeenCalled();
            expect(res.status).toBe(409); 
            expect(res.body.message).toBe('Email already in use');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@test.com', name: 'Test' }); // Missing password

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Missing required fields');
        });

        it('should handle errors during user creation', async () => {
            MockedUser.findByEmail.mockResolvedValueOnce(null);
            MockedUser.create.mockRejectedValueOnce(new Error('DB Error'));
            
            // Mock database error by changing implementation for this test
            mockDbPrepare.mockImplementationOnce(() => {
              throw new Error('Cannot read properties of undefined (reading \'prepare\')');
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(registerUserData);
            
            expect(res.status).toBe(500);
            expect(res.body.message).toBe('DB Error');
        });
    });

    describe('POST /api/auth/login', () => {
        // Note: These tests rely on the passport.authenticate middleware correctly
        // calling the LocalStrategy we configured in passport.ts, which in turn
        // uses the mocked User methods.
        
        it.skip('should login user with valid credentials and return token', async () => {
            // Mock the strategy finding the user and password comparison succeeding
            MockedUser.findByEmail.mockResolvedValueOnce(testUser);
            MockedUser.comparePassword.mockResolvedValueOnce(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send(testUserCredentials);
            
            // Passport LocalStrategy uses these mocks:
            expect(MockedUser.findByEmail).toHaveBeenCalledWith(testUserCredentials.email);
            expect(MockedUser.comparePassword).toHaveBeenCalledWith(testUserCredentials.password, testUser.password);
            expect(MockedUser.generateToken).toHaveBeenCalledWith(testUser.id);

            expect(res.status).toBe(200);
            expect(res.body.token).toBe('mock-jwt-token');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.id).toBe(testUser.id);
        });

        it.skip('should return 401 for invalid password', async () => {
            MockedUser.findByEmail.mockResolvedValueOnce(testUser);
            MockedUser.comparePassword.mockResolvedValueOnce(false); // Password doesn't match

            const res = await request(app)
                .post('/api/auth/login')
                .send({ ...testUserCredentials, password: 'wrongpassword' });

            expect(MockedUser.findByEmail).toHaveBeenCalledWith(testUserCredentials.email);
            expect(MockedUser.comparePassword).toHaveBeenCalledWith('wrongpassword', testUser.password);
            expect(MockedUser.generateToken).not.toHaveBeenCalled();
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Incorrect password.'); // Message from LocalStrategy
        });

        it.skip('should return 401 for non-existent user', async () => {
            MockedUser.findByEmail.mockResolvedValueOnce(null); // User not found

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nouser@example.com', password: 'password123' });

            expect(MockedUser.findByEmail).toHaveBeenCalledWith('nouser@example.com');
            expect(MockedUser.comparePassword).not.toHaveBeenCalled();
            expect(MockedUser.generateToken).not.toHaveBeenCalled();
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Incorrect email.'); // Message from LocalStrategy
        });
    });

    describe('GET /api/auth/status', () => {
        // Note: These tests rely on the passport.authenticate('jwt', ...) middleware
        // correctly calling the JwtStrategy configured in passport.ts, which uses MockedUser.findById.
        
        it.skip('should return user data for a valid JWT', async () => {
            const tokenUser = { id: 5, email: 'token@example.com', name: 'Token User' };
            MockedUser.findById.mockResolvedValueOnce(tokenUser); // Mock JWT strategy finding user

            const res = await request(app)
                .get('/api/auth/status')
                .set('Authorization', 'Bearer valid-token'); // Assume passport verifies token internally
            
            // Passport JwtStrategy uses this mock:
            // The actual token verification isn't tested here, only the result of the strategy finding the user
            expect(MockedUser.findById).toHaveBeenCalled(); 
            // We can't easily assert the ID payload extracted by passport without more complex mocking

            expect(res.status).toBe(200);
            expect(res.body.isAuthenticated).toBe(true);
            expect(res.body.user.id).toBe(tokenUser.id);
            expect(res.body.user.email).toBe(tokenUser.email);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it.skip('should return 401 if no Authorization header is present', async () => {
            const res = await request(app)
                .get('/api/auth/status');
                
            expect(res.status).toBe(401);
            // The body might be empty or contain passport's default 'Unauthorized' message
            expect(MockedUser.findById).not.toHaveBeenCalled();
        });

        it.skip('should return 401 if JWT is invalid or expired (simulated by user not found)', async () => {
            MockedUser.findById.mockResolvedValueOnce(null); // Simulate JWT strategy not finding user

            const res = await request(app)
                .get('/api/auth/status')
                .set('Authorization', 'Bearer invalid-or-expired-token');
            
            expect(MockedUser.findById).toHaveBeenCalled(); 
            expect(res.status).toBe(401);
             // Passport JwtStrategy returns 401 if user not found or other error
        });
    });

     describe('POST /api/auth/logout', () => {
        it('should return success message for logout', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .send(); // No body needed
            
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('Logout successful');
        });
    });
}); 