// Mock passport module for tests
export default {
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: () => (req, res, next) => {
    if (!req.headers.authorization) {
      if (req.path === '/api/favorites' && req.method === 'GET' || 
          req.path === '/api/favorites' && req.method === 'POST' ||
          req.path.startsWith('/api/favorites/') && req.method === 'DELETE') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    req.user = { id: 1, name: 'Test', email: 'test@test.com' };
    return next();
  }
}; 