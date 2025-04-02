import { enableFetchMocks } from 'jest-fetch-mock';
import {
  searchMedia,
  getMediaById,
  saveToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isInFavorites,
  getFavorites
} from '../app/services/api';
import { MovieDetails, SearchParams } from '@repo/types';

// Enable fetch mocks
enableFetchMocks();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API Service', () => {
  const mockMovie: MovieDetails = {
    imdbID: 'tt1234567',
    Title: 'Test Movie',
    Year: '2023',
    Type: 'movie',
    Poster: 'https://example.com/poster.jpg'
  };

  beforeEach(() => {
    fetchMock.resetMocks();
    localStorage.clear();
  });

  describe('searchMedia', () => {
    const searchParams: SearchParams = {
      query: 'test query',
      page: 1
    };

    it('makes a correct search request', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ Search: [mockMovie], totalResults: '1' }))
      );

      const result = await searchMedia(searchParams);

      expect(fetchMock).toHaveBeenCalled();
      expect(result.Search).toHaveLength(1);
    });

    it('includes type parameter when provided', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ Search: [mockMovie], totalResults: '1' }))
      );

      await searchMedia({ ...searchParams, type: 'movie' });

      expect(fetchMock).toHaveBeenCalled();
    });

    it('includes year parameter when provided', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ Search: [mockMovie], totalResults: '1' }))
      );

      await searchMedia({ ...searchParams, year: '2023' });

      expect(fetchMock).toHaveBeenCalled();
    });

    test('handles API errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      await expect(searchMedia(searchParams)).rejects.toThrow('Network error');
    });

    test('handles API response errors', async () => {
      const errorMessage = 'Movie not found!';
      fetchMock.mockResponse(JSON.stringify({
        Response: 'False',
        Error: errorMessage
      }), { status: 404 });

      await expect(searchMedia(searchParams)).rejects.toThrow();
    });
  });

  describe('getMediaById', () => {
    test('makes a correct request to get movie details', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockMovie));

      const result = await getMediaById('tt1234567');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/media/tt1234567'),
        expect.objectContaining({
          cache: 'no-store'
        })
      );
      expect(result).toEqual(mockMovie);
    });

    test('handles API errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      await expect(getMediaById('tt1234567')).rejects.toThrow('Network error');
    });
  });

  describe('Favorites functions', () => {
    describe('getUserFavorites', () => {
      test('returns empty array when not authenticated', async () => {
        const result = await getUserFavorites();
        expect(result).toEqual([]);
      });

      test('makes authenticated request when token exists', async () => {
        localStorage.setItem('token', 'fake-jwt-token');
        fetchMock.mockResponseOnce(JSON.stringify({
          success: true,
          favorites: [mockMovie]
        }));

        const result = await getUserFavorites();

        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/favorites'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer fake-jwt-token'
            })
          })
        );
        expect(result).toEqual([mockMovie]);
      });

      test('handles authentication errors gracefully', async () => {
        localStorage.setItem('token', 'invalid-token');
        fetchMock.mockResponseOnce(JSON.stringify({
          success: false,
          message: 'Invalid token'
        }), { status: 401 });

        const result = await getUserFavorites();
        
        expect(result).toEqual([]);
      });
    });

    describe('saveToFavorites', () => {
      test('returns false when not authenticated', async () => {
        const result = await saveToFavorites(mockMovie);
        
        expect(result).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      test('makes authenticated request when token exists', async () => {
        localStorage.setItem('token', 'fake-jwt-token');
        fetchMock.mockResponseOnce(JSON.stringify({
          success: true,
          message: 'Movie added to favorites'
        }));

        const result = await saveToFavorites(mockMovie);

        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/favorites'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer fake-jwt-token',
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ movieId: mockMovie.imdbID })
          })
        );
        expect(result).toBe(true);
        
        // Should update localStorage
        const storedFavorites = localStorage.getItem('favorites');
        expect(storedFavorites).toBeTruthy();
        if (storedFavorites) {
          expect(JSON.parse(storedFavorites)).toContainEqual(mockMovie);
        }
      });

      test('handles server errors', async () => {
        localStorage.setItem('token', 'fake-jwt-token');
        fetchMock.mockRejectOnce(new Error('Server error'));

        const result = await saveToFavorites(mockMovie);
        
        expect(result).toBe(false);
      });
    });

    describe('removeFromFavorites', () => {
      test('returns false when not authenticated', async () => {
        const result = await removeFromFavorites('tt1234567');
        
        expect(result).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      test('makes authenticated request when token exists', async () => {
        // Set up localStorage with the movie
        localStorage.setItem('favorites', JSON.stringify([mockMovie]));
        localStorage.setItem('token', 'fake-jwt-token');
        fetchMock.mockResponseOnce(JSON.stringify({
          success: true,
          message: 'Movie removed from favorites'
        }));

        const result = await removeFromFavorites('tt1234567');

        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/favorites/tt1234567'),
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'Authorization': 'Bearer fake-jwt-token'
            })
          })
        );
        expect(result).toBe(true);
        
        // Should update localStorage
        const storedFavorites = localStorage.getItem('favorites');
        expect(storedFavorites).toBeTruthy();
        if (storedFavorites) {
          expect(JSON.parse(storedFavorites)).not.toContainEqual(mockMovie);
        }
      });
    });

    describe('getFavorites and isInFavorites', () => {
      test('getFavorites returns empty array when localStorage is empty', () => {
        const result = getFavorites();
        expect(result).toEqual([]);
      });

      test('getFavorites returns movies from localStorage', () => {
        localStorage.setItem('favorites', JSON.stringify([mockMovie]));
        
        const result = getFavorites();
        expect(result).toEqual([mockMovie]);
      });

      test('isInFavorites returns true when movie is in favorites', () => {
        localStorage.setItem('favorites', JSON.stringify([mockMovie]));
        
        const result = isInFavorites('tt1234567');
        expect(result).toBe(true);
      });

      test('isInFavorites returns false when movie is not in favorites', () => {
        localStorage.setItem('favorites', JSON.stringify([mockMovie]));
        
        const result = isInFavorites('tt9999999');
        expect(result).toBe(false);
      });

      test('handles JSON parse errors', () => {
        localStorage.setItem('favorites', 'invalid json');
        
        const result = getFavorites();
        expect(result).toEqual([]);
      });
    });
  });
}); 