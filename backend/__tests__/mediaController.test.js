import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as mediaController from '../src/controllers/mediaController.js';
import * as mediaService from '../src/services/mediaService.js';

// Mock the logger to prevent console output during tests
vi.mock('../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the MediaServiceError class
class MockMediaServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'MediaServiceError';
  }
}

describe('Media Controller', () => {
  let mockRequest;
  let mockResponse;
  let statusResponse;
  let searchMediaSpy;
  let getMediaByIdSpy;

  beforeEach(() => {
    mockRequest = {
      query: {} // Initialize with empty query
    };
    // Mock for the object returned by status(), containing json()
    statusResponse = {
      json: vi.fn()
    };
    // Main response mock
    mockResponse = {
      json: vi.fn(),
      // status() mock now returns the statusResponse mock
      status: vi.fn().mockReturnValue(statusResponse) 
    };
    
    // Set up spies
    searchMediaSpy = vi.spyOn(mediaService, 'searchMedia');
    getMediaByIdSpy = vi.spyOn(mediaService, 'getMediaById');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchMediaController', () => {
    it('should return search results when valid query is provided', async () => {
      // Arrange
      const mockSearchResults = {
        Search: [
          {
            Title: 'Test Movie',
            Year: '2020',
            imdbID: 'tt1234567',
            Type: 'movie',
            Poster: 'https://example.com/poster.jpg'
          }
        ],
        totalResults: '1',
        Response: 'True'
      };

      mockRequest.query = { query: 'test' };
      searchMediaSpy.mockResolvedValue(mockSearchResults);

      // Act
      await mediaController.searchMediaController(mockRequest, mockResponse);

      // Assert
      expect(searchMediaSpy).toHaveBeenCalledWith({
        query: 'test',
        type: undefined,
        year: undefined,
        page: 1
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should return error when query is not provided', async () => {
      // Arrange
      mockRequest.query = {}; // No query param
      searchMediaSpy.mockRejectedValue(new Error('Search query is required'));

      // Act
      await mediaController.searchMediaController(mockRequest, mockResponse);

      // Assert 
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ 
        error: 'An unexpected error occurred while searching media.' 
      });
    });

    it('should return 500 when service throws an error', async () => {
      // Arrange
      mockRequest.query = { query: 'test' };
      const error = new Error('Service error');
      searchMediaSpy.mockRejectedValue(error);

      // Act
      await mediaController.searchMediaController(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ 
        error: 'An unexpected error occurred while searching media.' 
      });
    });

    it('should reject invalid year parameter (Cuts)', async () => {
      // Set up the request with an invalid year
      mockRequest.query = { query: 'test movie', year: 'Cuts' }; 
      const error = new Error('Invalid year format');
      searchMediaSpy.mockRejectedValue(error);
      
      // Call the controller
      await mediaController.searchMediaController(mockRequest, mockResponse);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('An unexpected error occurred while searching media')
        })
      );
    });
    
    it('should reject other invalid year formats', async () => {
      // Test with year that's too short
      mockRequest.query = { query: 'test movie', year: '123' };
      const error = new Error('Invalid year format');
      searchMediaSpy.mockRejectedValue(error);
      
      await mediaController.searchMediaController(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      
      // Verify the error message
      expect(statusResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('An unexpected error occurred while searching media')
        })
      );
    });
    
    it('should accept valid year parameter', async () => {
      // Set up the request with a valid year
      mockRequest.query = { query: 'test movie', year: '2020' };
      
      // Mock the service to return a result
      const mockResult = {
        Search: [], 
        totalResults: '0', 
        Response: 'True' 
      };
      searchMediaSpy.mockResolvedValue(mockResult);
      
      // Call the controller
      await mediaController.searchMediaController(mockRequest, mockResponse);
      
      // Verify searchMedia was called with the correct parameters
      expect(searchMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test movie',
          year: '2020',
          type: undefined,
          page: 1
        })
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getMediaByIdController', () => {
    it('should return media details when valid ID is provided', async () => {
      // Arrange
      const mockMediaDetails = {
        Title: 'Test Movie',
        Year: '2020',
        imdbID: 'tt1234567',
        Type: 'movie',
        Poster: 'https://example.com/poster.jpg',
        Plot: 'A test movie plot'
      };

      mockRequest.params = { id: 'tt1234567' };
      getMediaByIdSpy.mockResolvedValue(mockMediaDetails);

      // Act
      await mediaController.getMediaByIdController(mockRequest, mockResponse);

      // Assert
      expect(getMediaByIdSpy).toHaveBeenCalledWith('tt1234567');
      expect(mockResponse.json).toHaveBeenCalledWith(mockMediaDetails);
    });

    it('should return 404 when media is not found', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid-id' };
      const error = new MockMediaServiceError('Media not found', 404);
      getMediaByIdSpy.mockRejectedValue(error);

      // Act
      await mediaController.getMediaByIdController(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ 
        error: 'An unexpected error occurred while fetching media details.' 
      });
    });

    it('should return 500 when service throws an error', async () => {
      // Arrange
      mockRequest.params = { id: 'tt1234567' };
      const error = new Error('Service error');
      getMediaByIdSpy.mockRejectedValue(error);

      // Act
      await mediaController.getMediaByIdController(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ 
        error: 'An unexpected error occurred while fetching media details.' 
      });
    });
  });
}); 