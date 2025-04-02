'use client';

import { useState, useEffect, useCallback } from 'react';
import { addFavorite, removeFavorite, getFavorites } from '../services/api';
import { MovieDetails } from '@repo/types';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteButtonProps {
  movie: MovieDetails;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movie }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInitial, setIsCheckingInitial] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const checkInitialFavoriteStatus = useCallback(async () => {
    if (!isAuthenticated || !movie?.imdbID) return;
    
    setIsCheckingInitial(true);
    try {
      const favoriteIds = await getFavorites();
      const isInitiallyFavorite = favoriteIds.includes(movie.imdbID);
      setIsFavorite(isInitiallyFavorite);
    } catch (error) {
      console.error('[FavoriteButton] Error checking initial favorite status:', error);
    } finally {
      setIsCheckingInitial(false);
    }
  }, [isAuthenticated, movie?.imdbID]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      checkInitialFavoriteStatus();
    }
    if (!isAuthenticated) {
        setIsFavorite(false);
        setIsCheckingInitial(false);
    }
  }, [isAuthenticated, isAuthLoading, checkInitialFavoriteStatus]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || isCheckingInitial) {
      return;
    }

    setIsLoading(true);
    const currentIsFavorite = isFavorite;
    const movieId = movie.imdbID;

    setIsFavorite(!currentIsFavorite);
    
    try {
      if (!currentIsFavorite) {
        await addFavorite(movieId);
      } else {
        await removeFavorite(movieId);
      }
    } catch (error) {
      console.error(`[FavoriteButton] Error toggling favorite for ${movieId}:`, error);
      setIsFavorite(currentIsFavorite);
      alert('Failed to update favorites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isAuthLoading || isCheckingInitial || isLoading || !isAuthenticated;
  const buttonText = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
  const ariaLabel = isFavorite ? `Remove ${movie.Title} from favorites` : `Add ${movie.Title} to favorites`;

  return (
    <button
      data-testid="favorite-button"
      onClick={toggleFavorite}
      disabled={isDisabled}
      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFavorite
          ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 ring-1 ring-red-300 dark:ring-red-800/50'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-700'
      } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      aria-label={ariaLabel}
      title={!isAuthenticated ? "Sign in to add to favorites" : ""}
    >
      {(isLoading || isCheckingInitial || isAuthLoading) ? (
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
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
      )}
      {buttonText}
    </button>
  );
};

export default FavoriteButton; 