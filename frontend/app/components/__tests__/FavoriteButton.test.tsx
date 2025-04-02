import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FavoriteButton from '../FavoriteButton';
import { MovieDetails } from '@repo/types';
import * as api from '../../services/api';
import * as AuthContext from '../../contexts/AuthContext';

// Mock the API functions
jest.mock('../../services/api', () => ({
  saveToFavorites: jest.fn(),
  removeFromFavorites: jest.fn(),
  isInFavorites: jest.fn(),
  getUserFavorites: jest.fn(),
}));

// Mock the Auth Context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('FavoriteButton', () => {
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

  // Helper to mock useAuth response
  const mockAuthContext = (isAuthenticated: boolean) => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated,
      user: isAuthenticated ? { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] } : null,
      token: isAuthenticated ? 'fake-token' : null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateFavorites: jest.fn(),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset API mocks to return success by default
    (api.saveToFavorites as jest.Mock).mockResolvedValue(true);
    (api.removeFromFavorites as jest.Mock).mockResolvedValue(true);
    (api.getUserFavorites as jest.Mock).mockResolvedValue([]);
    // Default: not in favorites, user is authenticated
    (api.isInFavorites as jest.Mock).mockReturnValue(false);
    mockAuthContext(true);

    // Mock window alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    (window.alert as jest.Mock).mockRestore();
  });

  it('renders Add to Favorites button when movie is not in favorites', async () => {
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAccessibleName('Add to favorites');
    });
  });

  it('renders Remove from Favorites button when movie is in favorites', async () => {
    (api.isInFavorites as jest.Mock).mockReturnValue(true);
    (api.getUserFavorites as jest.Mock).mockResolvedValue([mockMovie]);

    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText(/remove from favorites/i)).toBeInTheDocument();
    });
  });

  it('calls saveToFavorites when Add to Favorites is clicked and user is authenticated', async () => {
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    expect(api.saveToFavorites).toHaveBeenCalledWith(mockMovie);
    
    // Wait for state update after async call
    await waitFor(() => {
      expect(screen.getByText(/remove from favorites/i)).toBeInTheDocument();
    });
  });

  it('calls removeFromFavorites when Remove from Favorites is clicked and user is authenticated', async () => {
    // Mock isInFavorites
    (api.isInFavorites as jest.Mock).mockReturnValue(true);
    (api.getUserFavorites as jest.Mock).mockResolvedValue([mockMovie]);
    (api.removeFromFavorites as jest.Mock).mockResolvedValue(true);

    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('favorite-icon')).toHaveAttribute('data-is-favorite', 'true');
    });

    // Click the button
    fireEvent.click(screen.getByTestId('favorite-button'));

    // Should have called removeFromFavorites
    await waitFor(() => {
      expect(api.removeFromFavorites).toHaveBeenCalledWith(mockMovie.imdbID);
    });
  });

  it('shows alert and does not call API when user is not authenticated', async () => {
    mockAuthContext(false);
    
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    expect(window.alert).toHaveBeenCalledWith('Please log in to add movies to favorites');
    expect(api.saveToFavorites).not.toHaveBeenCalled();
    expect(api.removeFromFavorites).not.toHaveBeenCalled();
  });

  it('displays loading state while API request is in progress', async () => {
    // Make the API call take some time
    (api.saveToFavorites as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(true), 100);
    }));
    
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    // Should show loading spinner
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('svg.animate-spin')).toBeInTheDocument();
    
    // After API responds, should show updated state
    await waitFor(() => {
      expect(screen.getByText(/remove from favorites/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
      expect(screen.queryByRole('button')?.querySelector('svg.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('gets favorites from server when user is authenticated', async () => {
    (api.getUserFavorites as jest.Mock).mockResolvedValue([mockMovie]);
    
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(api.getUserFavorites).toHaveBeenCalled();
      expect(screen.getByText(/remove from favorites/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock an error when saving
    (api.saveToFavorites as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Mock console.error to prevent test logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<FavoriteButton movie={mockMovie} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update favorites. Please try again.');
      expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    });
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });
}); 