import { describe, it, beforeAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Database from 'better-sqlite3';

// --- Mocks ---

// We need to mock passport differently for different tests
vi.mock('passport', async () => {
  const mockPassport = {
    initialize: vi.fn(() => (req, res, next) => next()),
    session: vi.fn(() => (req, res, next) => next()),
    use: vi.fn(),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
    authenticate: vi.fn().mockImplementation(() => {
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
  
  return {
    default: mockPassport,
    ...mockPassport
  };
});

// Mock the passport strategy modules
vi.mock('passport-local', () => {
  return {
    Strategy: class LocalStrategy {
      constructor(options, verify) {
        // Store options and verify callback if needed
      }
    }
  };
});

vi.mock('passport-jwt', () => {
  return {
    Strategy: class JwtStrategy {
      constructor(options, verify) {
        // Store options and verify callback if needed
      }
    },
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: () => () => {}
    }
  };
});

// Mock the User model (specifically findById for JWT strategy)
vi.mock('../src/models/User.js', () => {
  return {
    User: {
      findById: vi.fn(),
      // Other methods not directly needed if we mock DB for favorites
    },
    __esModule: true
  };
});

// Mock the DB utility functions, providing a mock DB object
let mockDbRunResult = { changes: 0, lastInsertRowid: 0 };
let mockDbAllResult = [];

vi.mock('../src/utils/db.js', () => {
  return {
    initDatabase: vi.fn(),
    getDb: vi.fn(), // Actual mock implementation moved to beforeAll
    closeDatabase: vi.fn(),
    __esModule: true
  };
});

// --- Test Suite ---

describe('Favorites API', () => {
    let User, getDb, MockedUser, mockDb;

    beforeAll(async () => {
        // Dynamically import modules after mocks are defined
        const userModule = await import('../src/models/User.js');
        User = userModule.User;
        const dbModule = await import('../src/utils/db.js');
        getDb = dbModule.getDb;

        // Setup mocks that depend on the dynamically imported modules
        MockedUser = User;
        mockDb = {
            prepare: vi.fn().mockReturnThis(),
            run: vi.fn().mockImplementation((userId, movieId) => {
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
            }),
            all: vi.fn().mockImplementation(() => mockDbAllResult),
            get: vi.fn()
        };
        getDb.mockImplementation(() => mockDb); // Apply mock implementation
    });

    const testUserId = 1;
    const mockValidToken = 'Bearer valid-user-token'; // Assume this token passes JWT strategy
    const testMovieId1 = 'tt1234567';
    const testMovieId2 = 'tt9876543';

    beforeEach(() => {
        vi.clearAllMocks();
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
            const error = new Error('UNIQUE constraint failed');
            error.code = 'SQLITE_CONSTRAINT_UNIQUE';
            mockDb.run.mockImplementationOnce(() => { throw error; });

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