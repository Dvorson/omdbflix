import { Request, Response } from 'express';
import * as mediaController from '../src/controllers/mediaController';
import { searchMedia, getMediaById, MediaServiceError } from '../src/services/mediaService';

// Mock only the functions, not the whole module, to preserve the class constructor
jest.mock('../src/services/mediaService', () => ({
  __esModule: true, // Needed for ES Modules
  searchMedia: jest.fn(),
  getMediaById: jest.fn(),
  // Do NOT mock MediaServiceError here, let the real one be used
  MediaServiceError: jest.requireActual('../src/services/mediaService').MediaServiceError 
}));

describe('Media Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusResponse: Partial<Response>; // Mock for the object returned by status()

  beforeEach(() => {
    mockRequest = {};
    // Mock for the object returned by status(), containing json()
    statusResponse = {
      json: jest.fn()
    };
    // Main response mock
    mockResponse = {
      json: jest.fn(),
      // status() mock now returns the statusResponse mock
      status: jest.fn().mockReturnValue(statusResponse) 
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      (searchMedia as jest.Mock).mockResolvedValue(mockSearchResults);

      // Act
      await mediaController.searchMediaController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(searchMedia).toHaveBeenCalledWith({
        query: 'test',
        type: undefined,
        year: undefined,
        page: 1
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it('should return 400 when query is not provided', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await mediaController.searchMediaController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(statusResponse.json).toHaveBeenCalledWith({ error: 'Search query is required' });
    });

    it('should return 500 when service throws an error', async () => {
      // Arrange
      mockRequest.query = { query: 'test' };
      const error = new Error('Service error');
      (searchMedia as jest.Mock).mockRejectedValue(error);

      // Act
      await mediaController.searchMediaController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
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
        Plot: 'A test movie plot',
        Director: 'Test Director',
        Rated: 'PG-13',
        Released: '01 Jan 2020',
        Runtime: '120 min',
        Genre: 'Action',
        Writer: 'Test Writer',
        Actors: 'Actor 1, Actor 2',
        Language: 'English',
        Country: 'USA',
        Awards: 'None',
        Ratings: [{ Source: 'Internet Movie Database', Value: '8.0/10' }],
        Metascore: '75',
        imdbRating: '8.0',
        imdbVotes: '1000'
      };

      mockRequest.params = { id: 'tt1234567' };
      (getMediaById as jest.Mock).mockResolvedValue(mockMediaDetails);

      // Act
      await mediaController.getMediaByIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(getMediaById).toHaveBeenCalledWith('tt1234567');
      expect(mockResponse.json).toHaveBeenCalledWith(mockMediaDetails);
    });

    it('should return 404 when media is not found', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid-id' };
      const error = new MediaServiceError('Media not found', 404);
      (getMediaById as jest.Mock).mockRejectedValue(error);

      // Act
      await mediaController.getMediaByIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(statusResponse.json).toHaveBeenCalledWith({ error: 'Media not found' });
    });

    it('should return 500 when service throws an error', async () => {
      // Arrange
      mockRequest.params = { id: 'tt1234567' };
      const error = new Error('Service error');
      (getMediaById as jest.Mock).mockRejectedValue(error);

      // Act
      await mediaController.getMediaByIdController(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(statusResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
}); 