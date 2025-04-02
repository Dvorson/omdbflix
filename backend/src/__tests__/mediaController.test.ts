import { searchMediaController } from '../controllers/mediaController';
import * as mediaService from '../services/mediaService';
import { logger } from '../utils/logger';

// Mock the mediaService module
jest.mock('../services/mediaService');
jest.mock('../utils/logger');

describe('Media Controller', () => {
  let req: any;
  let res: any;
  
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
    
    // Call the controller
    await searchMediaController(req, res);
    
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
    await searchMediaController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    
    // Test with non-numeric year
    req.query.year = 'abcd';
    await searchMediaController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  
  it('should accept valid year parameter', async () => {
    // Set up the request with a valid year
    req.query.year = '2020';
    
    // Mock the service to return a result
    const mockResult = { 
      Search: [], 
      totalResults: '0', 
      Response: 'True' 
    };
    (mediaService.searchMedia as jest.Mock).mockResolvedValue(mockResult);
    
    // Call the controller
    await searchMediaController(req, res);
    
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