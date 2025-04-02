import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovieCard from '../MovieCard';
import { Movie } from '../../types';

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

  it('renders correctly with a movie prop', () => {
    render(<MovieCard movie={mockMovie} />);
    
    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText('movie')).toBeInTheDocument();
    
    // Check link
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tt0111161');
    
    // Check poster image
    const image = screen.getByAltText('The Shawshank Redemption poster');
    expect(image).toHaveAttribute('src', 'https://example.com/poster.jpg');
  });

  it('uses a placeholder image when poster is N/A', () => {
    render(<MovieCard movie={mockMovieNoPoster} />);
    
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
    
    // Check placeholder image
    const image = screen.getByAltText('The Godfather poster');
    expect(image).toHaveAttribute('src', '/placeholder.png');
  });
}); 