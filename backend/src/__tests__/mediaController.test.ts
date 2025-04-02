import { searchMediaController } from '../controllers/mediaController';
import * as mediaService from '../services/mediaService';
import { Request, Response } from 'express';
import { OmdbSearchResult } from '@repo/types';

// Mock the mediaService module
jest.mock('../services/mediaService.js');

// Define proper types for request and response objects as partials of Express types
type PartialRequest = Partial<Request> & {
  query: {
    query: string;
    year?: string;
  };
};

type PartialResponse = Partial<Response> & {
  status: jest.Mock;
  json: jest.Mock;
};

describe('Media Controller', () => {
  let req: PartialRequest;
  let res: PartialResponse;
  
  beforeEach(() => {
    // Create mock request and response objects
    req = {
      query: {
        query: 'test movie'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  it('should reject invalid year parameter (Cuts)', async () => {
    // Set up the request with an invalid year
    req.query.year = 'Cuts';
    
    // Call the controller with type casting
    await searchMediaController(
      req as unknown as Request, 
      res as unknown as Response
    );
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Year must be a valid 4-digit year')
      })
    );
    
    // Verify searchMedia was not called
    expect(mediaService.searchMedia).not.toHaveBeenCalled();
  });
  
  it('should reject other invalid year formats', async () => {
    // Test with year that's too short
    req.query.year = '123';
    await searchMediaController(
      req as unknown as Request, 
      res as unknown as Response
    );
    expect(res.status).toHaveBeenCalledWith(400);
    
    // Test with non-numeric year
    req.query.year = 'abcd';
    await searchMediaController(
      req as unknown as Request, 
      res as unknown as Response
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
  
  it('should accept valid year parameter', async () => {
    // Set up the request with a valid year
    req.query.year = '2020';
    
    // Mock the service to return a result
    const mockResult: OmdbSearchResult = { 
      Search: [], 
      totalResults: '0', 
      Response: 'True' 
    };
    (mediaService.searchMedia as jest.Mock).mockResolvedValue(mockResult);
    
    // Call the controller
    await searchMediaController(
      req as unknown as Request, 
      res as unknown as Response
    );
    
    // Verify searchMedia was called with the correct parameters
    expect(mediaService.searchMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        year: '2020'
      })
    );
    
    // Verify the response
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
}); 