import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovieGrid from '../MovieGrid';
import { Movie } from '../../types';

// Mock the MovieCard component
jest.mock('../MovieCard', () => {
  return {
    __esModule: true,
    default: ({ movie }: { movie: Movie }) => (
      <div data-testid={`movie-card-${movie.imdbID}`}>
        <span>{movie.Title}</span>
      </div>
    ),
  };
});

describe('MovieGrid', () => {
  const mockMovies: Movie[] = [
    {
      imdbID: 'tt0111161',
      Title: 'The Shawshank Redemption',
      Year: '1994',
      Type: 'movie',
      Poster: 'https://example.com/poster1.jpg',
    },
    {
      imdbID: 'tt0068646',
      Title: 'The Godfather',
      Year: '1972',
      Type: 'movie',
      Poster: 'https://example.com/poster2.jpg',
    },
  ];

  it('renders loading state', () => {
    render(<MovieGrid movies={[]} loading={true} />);
    
    expect(screen.getByText('Loading movies...')).toBeInTheDocument();
  });

  it('renders empty state when no movies are provided', () => {
    render(<MovieGrid movies={[]} loading={false} />);
    
    expect(screen.getByText('No movies found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('renders movie cards for each movie', () => {
    render(<MovieGrid movies={mockMovies} loading={false} />);
    
    expect(screen.getByTestId('movie-card-tt0111161')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-tt0068646')).toBeInTheDocument();
    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
  });
}); 