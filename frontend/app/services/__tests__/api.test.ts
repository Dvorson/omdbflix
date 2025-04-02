import {
  searchMedia,
  getMediaById,
  saveToFavorites,
  removeFromFavorites,
  getFavorites,
  isInFavorites,
} from '../api';
import { MovieDetails } from '@repo/types';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
let mockLocalStorage: Record<string, string> = {};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: jest.fn(() => {
      mockLocalStorage = {};
    }),
  },
  writable: true,
});

// Helper function to mock a failed fetch response
const mockFetchFailure = (status: number, errorData: Record<string, unknown> = {}, errorText?: string) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: status,
    json: async () => { 
      // Simulate json() throwing if errorData is not suitable
      if (typeof errorData !== 'object' || errorData === null) throw new Error('Invalid JSON');
      return errorData; 
    },
    // Add the text method mock
    text: async () => errorText || JSON.stringify(errorData) || `HTTP error ${status}`,
  });
};

describe('API Service', () => {
  const mockMovie: MovieDetails = {
    imdbID: 'tt0111161',
    Title: 'The Shawshank Redemption',
    Year: '1994',
    Type: 'movie',
    Poster: 'https://example.com/poster.jpg',
    Rated: 'R',
    Released: '14 Oct 1994',
    Runtime: '142 min',
    Genre: 'Drama',
    Director: 'Frank Darabont',
    Writer: 'Stephen King, Frank Darabont',
    Actors: 'Tim Robbins, Morgan Freeman',
    Plot: 'Two imprisoned men bond over a number of years.',
    Language: 'English',
    Country: 'USA',
    Awards: 'Nominated for 7 Oscars',
    Ratings: [
      { Source: 'Internet Movie Database', Value: '9.3/10' },
      { Source: 'Rotten Tomatoes', Value: '91%' },
    ],
    Metascore: '80',
    imdbRating: '9.3',
    imdbVotes: '2,500,000',
  };

  // Mock implementation of console.error to avoid cluttering test output
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (window.localStorage.getItem as jest.Mock).mockClear();
    (window.localStorage.setItem as jest.Mock).mockClear();
    mockLocalStorage = {};
  });

  describe('searchMedia', () => {
    it('successfully fetches search results', async () => {
      const mockResponse = {
        Search: [mockMovie],
        totalResults: '1',
        Response: 'True',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchMedia({ query: 'shawshank' });
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `/api/media/search?query=shawshank`,
        undefined // Explicitly expect undefined options
      );
    });

    it('includes all search parameters in the URL', async () => {
      const mockResponse = {
        Search: [mockMovie],
        totalResults: '1',
        Response: 'True',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchMedia({
        query: 'shawshank',
        type: 'movie',
        year: '1994',
        page: 1,
      });

      expect(fetch).toHaveBeenCalledWith(
        `/api/media/search?query=shawshank&type=movie&year=1994&page=1`,
        undefined // Explicitly expect undefined options
      );
    });

    it('throws an error when the API response is not ok', async () => {
      // Mock fetch to fail, providing text fallback
      mockFetchFailure(500, {}, 'Internal Server Error'); 
      await expect(searchMedia({ query: 'error' })).rejects.toThrow(
        'Internal Server Error' // Expect the text fallback message
      );
    });

    it('throws an error when the fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchMedia({ query: 'shawshank' })).rejects.toThrow('Network error');
    });
  });

  describe('getMediaById', () => {
    it('successfully fetches media details', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMovie,
      });

      const result = await getMediaById('tt0111161');
      expect(result).toEqual(mockMovie);
      expect(fetch).toHaveBeenCalledWith(
        `/api/media/tt0111161`,
        { cache: 'no-store' } // Use exact object match
      );
    });

    it('throws an error when the API response is not ok', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => JSON.stringify({ error: 'Movie not found' }),
      });

      await expect(getMediaById('nonexistent')).rejects.toThrow('Movie not found');
    });

    it('handles non-JSON error responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Server Error',
      });

      // The actual error message will be 'Server Error' based on the implementation
      await expect(getMediaById('nonexistent')).rejects.toThrow('Server Error');
    });
  });

  describe('Favorites functionality', () => {
    it('saves a movie to favorites', () => {
      saveToFavorites(mockMovie);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify([mockMovie])
      );
    });

    it('does not add duplicate movies to favorites', () => {
      // Add movie to favorites first time
      saveToFavorites(mockMovie);
      
      // Simulate that localStorage already has this movie
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        JSON.stringify([mockMovie])
      );
      
      // Try to add the same movie again
      saveToFavorites(mockMovie);
      
      // Should only have been called once with this movie
      expect(window.localStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('removes a movie from favorites', () => {
      // Setup mock to return a list with our movie
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        JSON.stringify([mockMovie])
      );
      
      removeFromFavorites(mockMovie.imdbID);
      
      // Should update localStorage with empty array
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify([])
      );
    });

    it('gets all favorites', () => {
      // Setup mock to return a list with our movie
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        JSON.stringify([mockMovie])
      );
      
      const favorites = getFavorites();
      
      expect(favorites).toEqual([mockMovie]);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('favorites');
    });

    it('returns empty array when localStorage is empty', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
      
      const favorites = getFavorites();
      
      expect(favorites).toEqual([]);
    });

    it('returns empty array when localStorage throws an error', () => {
      (window.localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });
      
      const favorites = getFavorites();
      
      expect(favorites).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('checks if a movie is in favorites', () => {
      // Setup mock to return a list with our movie
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        JSON.stringify([mockMovie])
      );
      
      const isFavorite = isInFavorites(mockMovie.imdbID);
      
      expect(isFavorite).toBe(true);
    });

    it('returns false when a movie is not in favorites', () => {
      // Setup mock to return a list without our movie
      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        JSON.stringify([])
      );
      
      const isFavorite = isInFavorites(mockMovie.imdbID);
      
      expect(isFavorite).toBe(false);
    });
  });
}); 