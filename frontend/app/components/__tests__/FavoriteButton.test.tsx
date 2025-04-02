import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FavoriteButton from '../FavoriteButton';
import { MovieDetails } from '../../types';
import * as api from '../../services/api';

// Mock the API functions
jest.mock('../../services/api', () => ({
  saveToFavorites: jest.fn(),
  removeFromFavorites: jest.fn(),
  isInFavorites: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Add to Favorites button when movie is not in favorites', () => {
    // Mock that movie is not in favorites
    (api.isInFavorites as jest.Mock).mockReturnValue(false);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Check that it shows "Add to Favorites"
    expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName('Add to favorites');
  });

  it('renders Remove from Favorites button when movie is in favorites', () => {
    // Mock that movie is in favorites
    (api.isInFavorites as jest.Mock).mockReturnValue(true);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Check that it shows "Remove from Favorites"
    expect(screen.getByText('Remove from Favorites')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName('Remove from favorites');
  });

  it('calls saveToFavorites when Add to Favorites is clicked', () => {
    // Mock that movie is not in favorites
    (api.isInFavorites as jest.Mock).mockReturnValue(false);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Click the Add to Favorites button
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    // Check that saveToFavorites was called with the movie
    expect(api.saveToFavorites).toHaveBeenCalledWith(mockMovie);
    expect(api.removeFromFavorites).not.toHaveBeenCalled();
  });

  it('calls removeFromFavorites when Remove from Favorites is clicked', () => {
    // Mock that movie is in favorites
    (api.isInFavorites as jest.Mock).mockReturnValue(true);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Click the Remove from Favorites button
    fireEvent.click(screen.getByText('Remove from Favorites'));
    
    // Check that removeFromFavorites was called with the movie ID
    expect(api.removeFromFavorites).toHaveBeenCalledWith(mockMovie.imdbID);
    expect(api.saveToFavorites).not.toHaveBeenCalled();
  });

  it('updates button state after adding to favorites', () => {
    // Mock that movie is not in favorites initially
    (api.isInFavorites as jest.Mock).mockReturnValue(false);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Click the Add to Favorites button
    fireEvent.click(screen.getByText('Add to Favorites'));
    
    // The button text should change to "Remove from Favorites"
    expect(screen.getByText('Remove from Favorites')).toBeInTheDocument();
  });

  it('updates button state after removing from favorites', () => {
    // Mock that movie is in favorites initially
    (api.isInFavorites as jest.Mock).mockReturnValue(true);

    render(<FavoriteButton movie={mockMovie} />);
    
    // Click the Remove from Favorites button
    fireEvent.click(screen.getByText('Remove from Favorites'));
    
    // The button text should change to "Add to Favorites"
    expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
  });
}); 