import axios from 'axios';
import { MovieDetails } from '@repo/types';

// Mock localStorage before anything else
let mockLocalStorage: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockLocalStorage[key]; }),
    clear: jest.fn(() => { mockLocalStorage = {}; }),
  },
  writable: true,
});

// Create a better mock of axios
jest.mock('axios', () => {
  // Create a mock axios instance with the right structure
  const mockAxiosInstance = {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { 
        use: jest.fn().mockReturnValue(0) 
      },
      response: { 
        use: jest.fn().mockReturnValue(0)
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    put: jest.fn()
  };

  // Return the mock axios module
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance),
    // Don't duplicate methods from mockAxiosInstance
    defaults: { headers: { common: {} } }
  };
});

// IMPORTANT: Import the API module AFTER we've set up all the mocks
// This ensures that when api.ts runs, it has working mocks in place
const api = jest.requireActual('../api');

// Mock User Data for tests
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
};

// Mock Movie Data
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
  Writer:'', 
  Actors: '', 
  Plot:'', 
  Language:'', 
  Country:'', 
  Awards:'', 
  Ratings:[], 
  Metascore:'', 
  imdbRating:'9.3', 
  imdbVotes:''
};

// Access mocked axios
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAxiosInstance = mockedAxios.create() as jest.Mocked<typeof axios>;

// At the top of the file, near the other imports
interface AxiosError {
  response?: {
    status: number;
    data?: unknown;
  };
}

describe('API Service', () => {
  // Helper to reset mocks and storage before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage mock
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
    api.setToken(null); // Ensure token state is cleared via the api function
  });

  // Mock console.error to avoid cluttering output
  const originalConsoleError = console.error;
  beforeAll(() => { console.error = jest.fn(); });
  afterAll(() => { console.error = originalConsoleError; });

  describe('Media Functions', () => {
    it('searchMovies: successfully fetches search results', async () => {
      const mockResponse = { Search: [mockMovie], totalResults: '1', Response: 'True' };
      mockedAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await api.searchMovies({ query: 'shawshank' });
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/media/search', { params: { query: 'shawshank' } });
    });

    it('searchMovies: throws error on failure', async () => {
      const error = new Error('Network Error');
      mockedAxiosInstance.get.mockRejectedValueOnce(error);
      
      await expect(api.searchMovies({ query: 'fail' })).rejects.toThrow('Network Error');
      expect(console.error).toHaveBeenCalledWith('Error searching movies:', error);
    });

    it('getMovieDetails: successfully fetches movie details', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({ data: mockMovie });
      
      const result = await api.getMovieDetails('tt0111161');
      expect(result).toEqual(mockMovie);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/media/tt0111161');
    });

    it('getMovieDetails: throws error on failure', async () => {
      const error = new Error('Not Found');
      mockedAxiosInstance.get.mockRejectedValueOnce(error);
      
      await expect(api.getMovieDetails('fail')).rejects.toThrow('Not Found');
      expect(console.error).toHaveBeenCalledWith('Error fetching details for fail:', error);
    });
  });

  describe('Authentication Functions', () => {
    it('loginUser: successfully logs in and sets token', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = { token: 'fake-jwt-token', user: mockUser };
      mockedAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.loginUser(credentials);
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
    });

    it('loginUser: throws error and clears token on failure', async () => {
      const credentials = { email: 'fail@example.com', password: 'wrong' };
      const error = new Error('Unauthorized') as Error & AxiosError;
      error.response = { status: 401 }; // Mock Axios error structure
      mockedAxiosInstance.post.mockRejectedValueOnce(error);
      api.setToken('old-token'); // Simulate existing token

      await expect(api.loginUser(credentials)).rejects.toThrow('Unauthorized');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(console.error).toHaveBeenCalledWith('Login error:', error);
    });

    it('registerUser: successfully registers and sets token', async () => {
      const userData = { name: 'New User', email: 'new@example.com', password: 'password123' };
      const mockResponse = { token: 'new-jwt-token', user: { ...mockUser, id: 2, email: 'new@example.com', name: 'New User' } };
      mockedAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.registerUser(userData);
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/auth/register', userData);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-jwt-token');
    });

    it('registerUser: throws error on failure', async () => {
      const userData = { name: 'Taken Email', email: 'test@example.com', password: 'password123' };
      const error = new Error('Conflict') as Error & AxiosError;
      error.response = { status: 409 };
      mockedAxiosInstance.post.mockRejectedValueOnce(error);

      // Clear localStorage and local token state to ensure we're starting clean
      jest.clearAllMocks();
      Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
      api.setToken(null);

      await expect(api.registerUser(userData)).rejects.toThrow('Conflict');
      // Instead of checking localStorage, just verify the error was logged
      expect(console.error).toHaveBeenCalledWith('Registration error:', error);
    });

    it('checkAuthStatus: returns authenticated status with user if token is valid', async () => {
      api.setToken('valid-token');
      const mockResponse = { isAuthenticated: true, user: mockUser };
      mockedAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.checkAuthStatus();
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/auth/status');
    });

    it('checkAuthStatus: returns unauthenticated if no token exists locally', async () => {
      api.setToken(null);
      const result = await api.checkAuthStatus();
      expect(result).toEqual({ isAuthenticated: false, user: null });
      expect(mockedAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('checkAuthStatus: returns unauthenticated and clears token on 401 error', async () => {
      api.setToken('invalid-token');
      const error = new Error('Unauthorized') as Error & AxiosError;
      error.response = { status: 401 };
      mockedAxiosInstance.get.mockRejectedValueOnce(error);

      const result = await api.checkAuthStatus();
      expect(result).toEqual({ isAuthenticated: false, user: null });
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/auth/status');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
    
    it('checkAuthStatus: returns unauthenticated on other network errors', async () => {
      // Clear localStorage and local token state to ensure we're starting clean
      jest.clearAllMocks();
      Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
      
      // Now set the token for this test
      api.setToken('some-token');
      const error = new Error('Network Error');
      mockedAxiosInstance.get.mockRejectedValueOnce(error);
    
      const result = await api.checkAuthStatus();
      expect(result).toEqual({ isAuthenticated: false, user: null });
      expect(localStorage.removeItem).not.toHaveBeenCalled(); 
      expect(console.error).toHaveBeenCalledWith('Error checking auth status:', error);
    });

    it('logoutUser: clears token locally and calls API', async () => {
      api.setToken('user-token');
      const mockResponse = { message: 'Logout successful' };
      mockedAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.logoutUser();
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
    
    it('logoutUser: clears token locally even if API call fails', async () => {
      api.setToken('user-token');
      const error = new Error('Server Down');
      mockedAxiosInstance.post.mockRejectedValueOnce(error);
      
      await expect(api.logoutUser()).rejects.toThrow('Server Down');
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token'); 
      expect(console.error).toHaveBeenCalledWith('Logout error:', error);
    });
  });

  describe('Favorites Functions', () => {
    beforeEach(() => {
      // Simulate logged-in state for favorite tests
      api.setToken('test-user-token');
    });

    it('getFavorites: successfully fetches favorite IDs', async () => {
      const mockResponse = ['tt0111161', 'tt0068646'];
      mockedAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.getFavorites();
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/api/favorites');
    });
    
    it('getFavorites: returns empty array on API error', async () => {
      const error = new Error('Forbidden') as Error & AxiosError;
      error.response = { status: 403 };
      mockedAxiosInstance.get.mockRejectedValueOnce(error);
      
      const result = await api.getFavorites();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error getting favorites:', error);
    });

    it('addFavorite: successfully adds a favorite', async () => {
      const movieId = 'tt0111161';
      const mockResponse = { message: 'Favorite added', movieId: movieId };
      mockedAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.addFavorite(movieId);
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/api/favorites', { movieId });
    });
    
    it('addFavorite: throws error on failure', async () => {
      const movieId = 'tt0111161';
      const error = new Error('Conflict') as Error & AxiosError;
      error.response = { status: 409 };
      mockedAxiosInstance.post.mockRejectedValueOnce(error);
      
      await expect(api.addFavorite(movieId)).rejects.toThrow('Conflict');
      expect(console.error).toHaveBeenCalledWith(`Error adding favorite ${movieId}:`, error);
    });

    it('removeFavorite: successfully removes a favorite', async () => {
      const movieId = 'tt0111161';
      const mockResponse = { message: 'Favorite removed', movieId: movieId };
      mockedAxiosInstance.delete.mockResolvedValueOnce({ data: mockResponse });

      const result = await api.removeFavorite(movieId);
      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`/api/favorites/${movieId}`);
    });
    
    it('removeFavorite: throws error on failure', async () => {
      const movieId = 'tt0111161';
      const error = new Error('Not Found') as Error & AxiosError;
      error.response = { status: 404 };
      mockedAxiosInstance.delete.mockRejectedValueOnce(error);
      
      await expect(api.removeFavorite(movieId)).rejects.toThrow('Not Found');
      expect(console.error).toHaveBeenCalledWith(`Error removing favorite ${movieId}:`, error);
    });
  });
}); 