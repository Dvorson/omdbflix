// Mock class definition for MediaServiceError
export class MockMediaServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'MediaServiceError';
  }
}

// Mock the User model for auth tests
export const mockUser = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  findById: jest.fn()
};

// Mock DB functions
export const mockDb = {
  initDatabase: jest.fn(),
  getDb: jest.fn(),
  closeDatabase: jest.fn()
};

// Passport mock implementation
export const mockPassport = {
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn().mockImplementation(() => {
    return (req, res, next) => {
      // Simulated authentication
      if (!req.headers.authorization) {
        // Routes that should require authentication
        if (req.path === '/api/favorites' || 
            req.path.startsWith('/api/favorites/')) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      }
      
      // Set authenticated user for tests with auth header
      req.user = { id: 1, name: 'Test', email: 'test@test.com' };
      return next();
    };
  })
}; 