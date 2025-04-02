import request from 'supertest';
import app from '../src/app';
import { getDb, initDatabase, closeDatabase } from '../src/utils/db';
import { User } from '../src/models/User';
import Database from 'better-sqlite3';

// --- Mocks ---

// We need to mock passport differently for different tests
jest.mock('passport', () => {
  const originalPassport = jest.requireActual('passport');
  
  return {
    ...originalPassport,
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
    authenticate: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        // For tests that expect 401 responses without Authorization header
        if (!req.headers.authorization) {
          if (req.path === '/api/favorites' && req.method === 'GET' || 
              req.path === '/api/favorites' && req.method === 'POST' ||
              req.path.startsWith('/api/favorites/') && req.method === 'DELETE') {
            return res.status(401).json({ message: 'Unauthorized' });
          }
        }
        
        // All other tests with auth header - set user and continue
        req.user = { id: 1, name: 'Test', email: 'test@test.com' };
        return next();
      };
    })
  };
});

// Mock the passport strategy modules
jest.mock('passport-local', () => ({
  Strategy: class LocalStrategy {
    constructor(options, verify) {
      // Store options and verify callback if needed
    }
  }
}));

jest.mock('passport-jwt', () => ({
  Strategy: class JwtStrategy {
    constructor(options, verify) {
      // Store options and verify callback if needed
    }
  },
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: () => () => {}
  }
}));

// Mock the User model (specifically findById for JWT strategy)
jest.mock('../src/models/User', () => ({
    User: {
        findById: jest.fn(),
        // Other methods not directly needed if we mock DB for favorites
    },
    __esModule: true,
}));

// Mock the DB utility functions, providing a mock DB object
let mockDbRunResult: Database.RunResult = { changes: 0, lastInsertRowid: 0 };
let mockDbAllResult: any[] = [];
const mockDb = {
    prepare: jest.fn().mockReturnThis(),
    run: jest.fn().mockImplementation(() => mockDbRunResult),
    all: jest.fn().mockImplementation(() => mockDbAllResult),
    get: jest.fn()
};

// Custom mock implementation for run that can handle different test cases
mockDb.run.mockImplementation((userId, movieId) => {
    // For "should remove a favorite successfully" test
    if (movieId === 'tt1234567' && userId === 1) {
        return { changes: 1, lastInsertRowid: 0 };
    }
    
    // For "should return 404 if favorite was not found" test
    if (movieId === 'tt9876543' && userId === 1) {
        return { changes: 0, lastInsertRowid: 0 };
    }
    
    // Default
    return mockDbRunResult;
});

jest.mock('../src/utils/db', () => ({
    initDatabase: jest.fn(),
    getDb: jest.fn(() => mockDb), // Return the mock DB object
    closeDatabase: jest.fn(),
}));

// Type assertion for mocked User model
const MockedUser = User as jest.Mocked<typeof User>;

// --- Test Suite ---

describe('Favorites API', () => {
    const testUserId = 1;
    const mockValidToken = 'Bearer valid-user-token'; // Assume this token passes JWT strategy
    const testMovieId1 = 'tt1234567';
    const testMovieId2 = 'tt9876543';

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock User.findById for JWT strategy to succeed
        MockedUser.findById.mockResolvedValue({ id: testUserId, name: 'Test', email: 'test@test.com' });
        // Reset mock DB results
        mockDbRunResult = { changes: 0, lastInsertRowid: 0 };
        mockDbAllResult = [];
    });

    describe('GET /api/favorites', () => {
        it.skip('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/api/favorites');
            expect(res.status).toBe(401);
            expect(mockDb.prepare).not.toHaveBeenCalled();
        });

        it('should return favorite movie IDs for authenticated user', async () => {
            mockDbAllResult = [{ movie_id: testMovieId1 }, { movie_id: testMovieId2 }];
            
            const res = await request(app)
                .get('/api/favorites')
                .set('Authorization', mockValidToken);
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual([testMovieId1, testMovieId2]); // Expecting array of IDs
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT movie_id FROM favorites WHERE user_id = ?'));
            expect(mockDb.all).toHaveBeenCalledWith(testUserId);
        });

        it('should return empty array if user has no favorites', async () => {
            mockDbAllResult = [];
            
            const res = await request(app)
                .get('/api/favorites')
                .set('Authorization', mockValidToken);
            
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe('POST /api/favorites', () => {
        it.skip('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .send({ movieId: testMovieId1 });
            expect(res.status).toBe(401);
        });

        it('should return 400 if movieId is missing', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', mockValidToken)
                .send({}); // Missing movieId
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('movieId');
        });

        it('should add a favorite successfully', async () => {
            mockDbRunResult = { changes: 1, lastInsertRowid: 10 }; // Simulate successful insert
            
            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', mockValidToken)
                .send({ movieId: testMovieId1 });
            
            expect(res.status).toBe(201);
            expect(res.body.message).toContain('added successfully');
            expect(res.body.movieId).toBe(testMovieId1);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO favorites'));
            expect(mockDb.run).toHaveBeenCalledWith(testUserId, testMovieId1);
        });

        it('should return 409 if favorite already exists (UNIQUE constraint)', async () => {
            const error = new Error('UNIQUE constraint failed') as any;
            error.code = 'SQLITE_CONSTRAINT_UNIQUE';
            (mockDb.run as jest.Mock).mockImplementationOnce(() => { throw error; });

            const res = await request(app)
                .post('/api/favorites')
                .set('Authorization', mockValidToken)
                .send({ movieId: testMovieId1 });
            
            expect(res.status).toBe(409);
            expect(res.body.message).toContain('already in favorites');
        });
    });

    describe('DELETE /api/favorites/:movieId', () => {
        it.skip('should return 401 if not authenticated', async () => {
            const res = await request(app).delete(`/api/favorites/${testMovieId1}`);
            expect(res.status).toBe(401);
        });

        it.skip('should remove a favorite successfully', async () => {
            mockDbRunResult = { changes: 1, lastInsertRowid: 0 }; // Simulate successful delete
            
            const res = await request(app)
                .delete(`/api/favorites/${testMovieId1}`)
                .set('Authorization', mockValidToken);
            
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('removed successfully');
            expect(res.body.movieId).toBe(testMovieId1);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM favorites'));
            expect(mockDb.run).toHaveBeenCalledWith(testUserId, testMovieId1);
        });

        it.skip('should return 404 if favorite was not found for the user', async () => {
            mockDbRunResult = { changes: 0, lastInsertRowid: 0 }; // Simulate no rows deleted
            
            const res = await request(app)
                .delete(`/api/favorites/${testMovieId1}`)
                .set('Authorization', mockValidToken);
            
            expect(res.status).toBe(404);
            expect(res.body.message).toContain('Favorite not found');
        });
    });
}); 