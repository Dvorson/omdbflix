import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '../FavoriteButton';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api'; // Import all API functions
import { MovieDetails } from '@repo/types';
import { act } from 'react';

// --- Mocks ---

// Mock useAuth hook
const mockUseAuth = useAuth as jest.Mock;
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API module
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock Movie Data
const mockMovie: MovieDetails = {
  imdbID: 'tt0111161',
  Title: 'The Shawshank Redemption',
  Year: '1994',
  Type: 'movie',
  Poster: 'N/A', // Poster not relevant for button logic
  // Add other required fields for MovieDetails
  Rated:'R', Released:'', Runtime:'', Genre:'', Director:'', Writer:'', Actors:'', Plot:'', Language:'', Country:'', Awards:'', Ratings:[], Metascore:'', imdbRating:'', imdbVotes:''
};

// --- Test Suite ---

describe('FavoriteButton', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user, not loading
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    // Default mock API responses
    mockedApi.getFavorites.mockResolvedValue([]); // Start with no favorites
    mockedApi.addFavorite.mockResolvedValue({ message: 'Added', movieId: mockMovie.imdbID });
    mockedApi.removeFavorite.mockResolvedValue({ message: 'Removed', movieId: mockMovie.imdbID });
  });

  it('renders nothing if user is not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    const { container } = render(<FavoriteButton movie={mockMovie} />);
    expect(container.firstChild).toBeNull();
  });
  
  it('renders loading spinner if auth is loading', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
      render(<FavoriteButton movie={mockMovie} />);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button').querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('fetches initial favorite status and renders "Add" button if not favorited', async () => {
    mockedApi.getFavorites.mockResolvedValueOnce([]); // Not in favorites initially
    render(<FavoriteButton movie={mockMovie} />);

    // Wait for initial check to complete (loading spinner disappears)
    await waitFor(() => {
        expect(screen.getByRole('button').querySelector('svg.animate-spin')).not.toBeInTheDocument();
    });
    
    expect(mockedApi.getFavorites).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Add .* to favorites/i })).toBeInTheDocument();
    expect(screen.getByTestId('favorite-icon')).toHaveAttribute('data-is-favorite', 'false');
  });

  it('fetches initial favorite status and renders "Remove" button if favorited', async () => {
    mockedApi.getFavorites.mockResolvedValueOnce([mockMovie.imdbID]); // Is in favorites initially
    render(<FavoriteButton movie={mockMovie} />);

    await waitFor(() => {
        expect(screen.getByRole('button').querySelector('svg.animate-spin')).not.toBeInTheDocument();
    });

    expect(mockedApi.getFavorites).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Remove .* from favorites/i })).toBeInTheDocument();
    expect(screen.getByTestId('favorite-icon')).toHaveAttribute('data-is-favorite', 'true');
  });

  it('calls addFavorite and updates UI when "Add" is clicked', async () => {
    mockedApi.getFavorites.mockResolvedValueOnce([]);
    render(<FavoriteButton movie={mockMovie} />);

    // Wait for initial load
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add .* to favorites/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add .* to favorites/i });
    await act(async () => {
      await userEvent.click(addButton);
    });

    expect(mockedApi.addFavorite).toHaveBeenCalledWith(mockMovie.imdbID);
    // Check for optimistic update
    expect(screen.getByRole('button', { name: /Remove .* from favorites/i })).toBeInTheDocument();
  });

  it('calls removeFavorite and updates UI when "Remove" is clicked', async () => {
    mockedApi.getFavorites.mockResolvedValueOnce([mockMovie.imdbID]);
    render(<FavoriteButton movie={mockMovie} />);

    // Wait for initial load
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Remove .* from favorites/i })).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /Remove .* from favorites/i });
     await act(async () => {
        await userEvent.click(removeButton);
     });

    expect(mockedApi.removeFavorite).toHaveBeenCalledWith(mockMovie.imdbID);
    // Check for optimistic update
    expect(screen.getByRole('button', { name: /Add .* to favorites/i })).toBeInTheDocument();
  });
  
  it('reverts UI and shows alert if addFavorite fails', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      mockedApi.getFavorites.mockResolvedValueOnce([]);
      mockedApi.addFavorite.mockRejectedValueOnce(new Error('API Error'));
      render(<FavoriteButton movie={mockMovie} />);
  
      await waitFor(() => {
          expect(screen.getByRole('button', { name: /Add .* to favorites/i })).toBeInTheDocument();
      });
  
      const addButton = screen.getByRole('button', { name: /Add .* to favorites/i });
       await act(async () => {
          await userEvent.click(addButton);
       });
  
      // Still expect addFavorite to have been called
      expect(mockedApi.addFavorite).toHaveBeenCalledWith(mockMovie.imdbID);
      // Wait for error handling to revert state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add .* to favorites/i })).toBeInTheDocument();
      });
      expect(alertMock).toHaveBeenCalledWith('Failed to update favorites. Please try again.');
      alertMock.mockRestore();
    });

    it('reverts UI and shows alert if removeFavorite fails', async () => {
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
        mockedApi.getFavorites.mockResolvedValueOnce([mockMovie.imdbID]);
        mockedApi.removeFavorite.mockRejectedValueOnce(new Error('API Error'));
        render(<FavoriteButton movie={mockMovie} />);
    
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Remove .* from favorites/i })).toBeInTheDocument();
        });
    
        const removeButton = screen.getByRole('button', { name: /Remove .* from favorites/i });
         await act(async () => {
            await userEvent.click(removeButton);
         });
    
        // Still expect removeFavorite to have been called
        expect(mockedApi.removeFavorite).toHaveBeenCalledWith(mockMovie.imdbID);
        // Wait for error handling to revert state
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Remove .* from favorites/i })).toBeInTheDocument();
        });
        expect(alertMock).toHaveBeenCalledWith('Failed to update favorites. Please try again.');
        alertMock.mockRestore();
      });
}); 