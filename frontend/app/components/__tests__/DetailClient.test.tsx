import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetailClient from '../DetailClient';
import { MovieDetails } from '../../types';

// Mock next/navigation
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img data-testid="movie-poster" {...props} src={props.src as string} alt={props.alt as string} />;
  },
}));

// Mock FavoriteButton component
jest.mock('../FavoriteButton', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ movie }: { movie: MovieDetails }) => (
    <button data-testid="favorite-button">Mock Favorite Button</button>
  ),
}));

describe('DetailClient', () => {
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

  it('renders error state when error prop is provided', () => {
    render(<DetailClient error="Failed to load movie details" />);
    
    expect(screen.getByText('Failed to load movie details')).toBeInTheDocument();
    expect(screen.getByText("We couldn't find the movie you're looking for.")).toBeInTheDocument();
    
    // Check for go back button
    const backButton = screen.getByRole('button', { name: /go back/i });
    expect(backButton).toBeInTheDocument();
    
    // Click go back button
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders error state when movie is not provided', () => {
    render(<DetailClient />);
    
    expect(screen.getByText('Movie not found')).toBeInTheDocument();
    expect(screen.getByText("We couldn't find the movie you're looking for.")).toBeInTheDocument();
  });

  it('renders movie details when movie is provided', () => {
    render(<DetailClient movie={mockMovie} />);
    
    // Check for title and basic info
    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('142 min')).toBeInTheDocument();
    
    // Check for plot
    expect(screen.getByText('Plot')).toBeInTheDocument();
    expect(screen.getByText('Two imprisoned men bond over a number of years.')).toBeInTheDocument();
    
    // Check for details section
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Genre:')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Director:')).toBeInTheDocument();
    expect(screen.getByText('Frank Darabont')).toBeInTheDocument();
    
    // Check for ratings section
    expect(screen.getByText('Ratings')).toBeInTheDocument();
    expect(screen.getByText('IMDb Rating')).toBeInTheDocument();
    
    // Use getAllByText to find all instances of 9.3/10 or similar
    const ratingElements = screen.getAllByText(/9\.3/);
    expect(ratingElements.length).toBeGreaterThan(0);
    
    // Check for poster
    const poster = screen.getByTestId('movie-poster');
    expect(poster).toHaveAttribute('src', 'https://example.com/poster.jpg');
    expect(poster).toHaveAttribute('alt', 'The Shawshank Redemption poster');
    
    // Check for back button
    const backButton = screen.getByText('Back to results');
    expect(backButton).toBeInTheDocument();
    
    // Click back button
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
    
    // Check for favorite button
    expect(screen.getByTestId('favorite-button')).toBeInTheDocument();
  });

  it('renders placeholder image when poster is N/A', () => {
    const movieWithoutPoster = {
      ...mockMovie,
      Poster: 'N/A',
    };
    
    render(<DetailClient movie={movieWithoutPoster} />);
    
    const poster = screen.getByTestId('movie-poster');
    expect(poster).toHaveAttribute('src', '/placeholder.png');
  });
}); 