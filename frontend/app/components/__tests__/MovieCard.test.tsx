import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovieCard from '../MovieCard';
import { MovieDetails } from '@repo/types'; // Use MovieDetails for full type
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src as string} alt={props.alt as string} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock axios for AuthProvider
jest.mock('axios', () => ({
  defaults: {
    headers: {
      common: {}
    }
  },
  get: jest.fn().mockResolvedValue({ data: { success: true, user: { id: '1', name: 'Test', email: 'test@example.com', favorites: [] } } }),
  post: jest.fn().mockResolvedValue({ data: { token: 'fake-token', user: { id: '1', name: 'Test', email: 'test@example.com', favorites: [] } } }),
}));

// Mock FavoriteButton directly
jest.mock('../FavoriteButton', () => ({
  __esModule: true,
  default: ({ movie }: { movie: MovieDetails }) => <button data-testid="mock-favorite-button">Fav</button>,
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(), // Use the mock function
}));

describe('MovieCard', () => {
  const mockMovie: MovieDetails = {
    imdbID: 'tt0111161',
    Title: 'The Shawshank Redemption',
    Year: '1994',
    Type: 'movie',
    Poster: 'https://example.com/poster.jpg',
    // Add other required fields for MovieDetails
    Rated:'R', Released:'', Runtime:'', Genre:'', Director:'', Writer:'', Actors:'', Plot:'', Language:'', Country:'', Awards:'', Ratings:[], Metascore:'', imdbRating:'', imdbVotes:''
  };

  const mockMovieNoPoster: MovieDetails = {
    imdbID: 'tt0111162',
    Title: 'The Godfather',
    Year: '1972',
    Type: 'movie',
    Poster: 'N/A',
    // Add other required fields
    Rated:'R', Released:'', Runtime:'', Genre:'', Director:'', Writer:'', Actors:'', Plot:'', Language:'', Country:'', Awards:'', Ratings:[], Metascore:'', imdbRating:'', imdbVotes:''
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Default mock state for useAuth (unauthenticated)
    mockUseAuth.mockReturnValue({ isAuthenticated: false }); 
  });

  it('renders correctly with a movie prop', () => {
    render(<MovieCard movie={mockMovie} />);
    
    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText(/movie/i)).toBeInTheDocument();
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tt0111161');
    
    const image = screen.getByAltText('The Shawshank Redemption poster');
    expect(image).toHaveAttribute('src', 'https://example.com/poster.jpg');
  });

  it('uses a placeholder image when poster is N/A', () => {
    render(<MovieCard movie={mockMovieNoPoster} />);
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
    const image = screen.getByAltText('The Godfather poster');
    expect(image).toHaveAttribute('src', '/placeholder.png');
  });

  it('renders disabled favorite button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false }); 
    render(<MovieCard movie={mockMovie} />);
    const button = screen.getByRole('button', { name: /add .* to favorites/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Sign in to add to favorites');
  });

  it('renders enabled favorite button (mock) when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    render(<MovieCard movie={mockMovie} />);
    // We are checking for our mock button now
    expect(screen.getByTestId('mock-favorite-button')).toBeInTheDocument();
    // The disabled button should NOT be present
    expect(screen.queryByRole('button', { name: /sign in to add/i })).not.toBeInTheDocument();
  });
}); 