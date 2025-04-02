'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MovieDetails } from '@repo/types';
import FavoriteButton from './FavoriteButton';
import { useAuth } from '../contexts/AuthContext';

interface MovieCardProps {
  movie: MovieDetails;
}

/**
 * Component to display movie information in a card format
 * Displays title, year, type, poster image and favorite button
 */
function MovieCard({ movie }: MovieCardProps) {
  const {
    imdbID,
    Title,
    Year,
    Type,
    Poster,
  } = movie;
  const { isAuthenticated } = useAuth();

  return (
    <div 
      data-testid="movie-card"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col transition-colors duration-300"
    >
      <Link href={`/${imdbID}`} className="block flex-grow">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={Poster !== 'N/A' ? Poster : '/placeholder.png'}
            alt={`${Title} poster`}
            fill={true}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{Title}</h3>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="mr-2">{Year}</span>
              <span className="capitalize">{Type}</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-4 pt-0 flex justify-end">
        {isAuthenticated ? (
          <FavoriteButton movie={movie} />
        ) : (
          <button 
            disabled 
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 opacity-70 cursor-not-allowed"
            title="Sign in to add to favorites"
            data-testid="favorite-button"
            aria-label={`Sign in to add ${Title} to favorites`}
          >
            <svg
              className={`h-5 w-5 text-gray-400 dark:text-gray-500 mr-2`}
              fill='none'
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Add to Favorites
          </button>
        )}
      </div>
    </div>
  );
}

MovieCard.displayName = 'MovieCard';

/**
 * Memoized version of MovieCard component to prevent unnecessary rerenders
 * Only rerenders when movie ID changes
 */
export default memo(MovieCard, (prevProps, nextProps) => {
  return prevProps.movie.imdbID === nextProps.movie.imdbID;
}); 