import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovieCard from '../MovieCard';
import { Movie } from '@repo/types';
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

describe('MovieCard', () => {
  const mockMovie: Movie = {
    imdbID: 'tt0111161',
    Title: 'The Shawshank Redemption',
    Year: '1994',
    Type: 'movie',
    Poster: 'https://example.com/poster.jpg',
  };

  const mockMovieNoPoster: Movie = {
    imdbID: 'tt0111162',
    Title: 'The Godfather',
    Year: '1972',
    Type: 'movie',
    Poster: 'N/A',
  };

  // Helper function to render with AuthProvider
  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthProvider>
        {ui}
      </AuthProvider>
    );
  };

  it('renders correctly with a movie prop', () => {
    renderWithAuth(<MovieCard movie={mockMovie} />);
    
    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText(/movie/i)).toBeInTheDocument();
    
    // Check link
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tt0111161');
    
    // Check poster image
    const image = screen.getByAltText('The Shawshank Redemption poster');
    expect(image).toHaveAttribute('src', 'https://example.com/poster.jpg');
  });

  it('uses a placeholder image when poster is N/A', () => {
    renderWithAuth(<MovieCard movie={mockMovieNoPoster} />);
    
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
    
    // Check placeholder image
    const image = screen.getByAltText('The Godfather poster');
    expect(image).toHaveAttribute('src', '/placeholder.png');
  });
}); 