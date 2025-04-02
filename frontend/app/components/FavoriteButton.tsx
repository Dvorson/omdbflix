'use client';

import { useState, useEffect } from 'react';
import { saveToFavorites, removeFromFavorites, isInFavorites } from '../services/api';
import { MovieDetails } from '@repo/types';

interface FavoriteButtonProps {
  movie: MovieDetails;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movie }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isInFavorites(movie.imdbID));
  }, [movie.imdbID]);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(movie.imdbID);
      setIsFavorite(false);
    } else {
      saveToFavorites(movie);
      setIsFavorite(true);
    }
  };

  return (
    <button
      data-testid="favorite-button"
      onClick={toggleFavorite}
      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFavorite
          ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 ring-1 ring-red-300 dark:ring-red-800/50'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-700'
      }`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        data-testid="favorite-icon"
        data-is-favorite={isFavorite.toString()}
        className={`h-5 w-5 ${isFavorite ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} mr-2 transition-colors duration-200`}
        fill={isFavorite ? 'currentColor' : 'none'}
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
      {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    </button>
  );
};

export default FavoriteButton; 