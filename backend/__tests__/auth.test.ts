import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/User';

// Mock the User model
jest.mock('../src/models/User', () => {
  const mockUser = {
    _id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$XcGbzwmGJ/GQ5hBxJNBL8.YbXQX6Tkl1K1G9Pgol7w4QkAR/HV3Ee', // hashed 'password123'
    favorites: ['tt0111161', 'tt0068646'],
    comparePassword: jest.fn().mockImplementation(function(candidatePassword) {
      return Promise.resolve(candidatePassword === 'password123');
    }),
    generateAuthToken: jest.fn().mockReturnValue('mock-token'),
    save: jest.fn().mockResolvedValue(this)
  };
  
  return {
    findOne: jest.fn().mockImplementation((criteria) => {
      if (criteria.email === 'test@example.com') {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    }),
    findById: jest.fn().mockImplementation((id) => {
      if (id === 'mock-user-id') {
        return {
          select: jest.fn().mockResolvedValue(mockUser)
        };
      }
      return {
        select: jest.fn().mockResolvedValue(null)
      };
    }),
    prototype: {
      save: jest.fn().mockResolvedValue(mockUser)
    },
    __esModule: true,
    default: function() {
      return {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser)
      };
    }
  };
});

// Mock JWT verify
jest.mock('jsonwebtoken');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('mock-token');
      expect(res.body.user).toBeDefined();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
    
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
    
    it('should reject login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'newpassword123'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe('mock-token');
      expect(res.body.user).toBeDefined();
    });
    
    it('should reject registration with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com', // Already exists
          password: 'password123'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should get authenticated user profile', async () => {
      // Mock JWT verify to return valid user id
      (jwt.verify as jest.Mock).mockReturnValueOnce({ id: 'mock-user-id' });
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('test@example.com');
    });
    
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, no token');
    });
    
    it('should reject request with invalid token', async () => {
      // Mock JWT verify to throw error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, token failed');
    });
  });
}); 