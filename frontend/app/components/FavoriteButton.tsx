'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveToFavorites, removeFromFavorites, isInFavorites, getUserFavorites } from '../services/api';
import { MovieDetails } from '@repo/types';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  movie: MovieDetails;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movie }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user, updateFavorites } = useAuth();
  const router = useRouter();

  // Check favorite status (improved implementation)
  const checkFavoriteStatus = useCallback(async () => {
    console.log(`[DEBUG] Checking favorite status for ${movie.Title} (${movie.imdbID})`);
    
    // Always check local storage first for immediate UI feedback
    const localIsFavorite = isInFavorites(movie.imdbID);
    console.log(`[DEBUG] Local storage check: ${localIsFavorite}`);
    
    // Set state immediately from local storage
    setIsFavorite(localIsFavorite);
    
    // If authenticated, verify with server
    if (isAuthenticated) {
      try {
        const serverFavorites = await getUserFavorites();
        const serverIsFavorite = serverFavorites.some(fav => fav.imdbID === movie.imdbID);
        console.log(`[DEBUG] Server check: ${serverIsFavorite}`);
        
        // Update state if different from local
        if (serverIsFavorite !== localIsFavorite) {
          console.log(`[DEBUG] Updating state from server: ${serverIsFavorite}`);
          setIsFavorite(serverIsFavorite);
        }
      } catch (error) {
        console.error('[DEBUG] Error checking server favorites:', error);
        // Keep the local storage state if server check fails
      }
    }
  }, [movie.imdbID, movie.Title, isAuthenticated]);

  // Load favorite status on mount and when dependencies change
  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please log in to add movies to favorites');
      return;
    }

    setIsLoading(true);
    
    // Immediately change UI state for better user experience
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    console.log(`[DEBUG] Toggling favorite for ${movie.Title} to ${newFavoriteState}`);
    
    try {
      let success = false;
      
      if (newFavoriteState) {
        // Update local storage immediately for faster UI response
        const favorites = localStorage.getItem('favorites');
        let favoritesArray = favorites ? JSON.parse(favorites) : [];
        if (!favoritesArray.some((item: any) => item.imdbID === movie.imdbID)) {
          favoritesArray.push(movie);
          localStorage.setItem('favorites', JSON.stringify(favoritesArray));
          console.log(`[DEBUG] Updated localStorage - added ${movie.imdbID}`);
        }
        
        // Save to server
        success = await saveToFavorites(movie);
        console.log(`[DEBUG] saveToFavorites result: ${success}`);
        
        // Update auth context
        if (success && user && updateFavorites) {
          const updatedFavorites = [...(user.favorites || []), movie.imdbID];
          updateFavorites(updatedFavorites);
          console.log(`[DEBUG] Updated auth context favorites`);
        }
      } else {
        // Update local storage immediately for faster UI response
        const favorites = localStorage.getItem('favorites');
        if (favorites) {
          let favoritesArray = JSON.parse(favorites);
          favoritesArray = favoritesArray.filter((item: any) => item.imdbID !== movie.imdbID);
          localStorage.setItem('favorites', JSON.stringify(favoritesArray));
          console.log(`[DEBUG] Updated localStorage - removed ${movie.imdbID}`);
        }
        
        // Remove from server
        success = await removeFromFavorites(movie.imdbID);
        console.log(`[DEBUG] removeFromFavorites result: ${success}`);
        
        // Update auth context
        if (success && user && updateFavorites) {
          const updatedFavorites = (user.favorites || []).filter(id => id !== movie.imdbID);
          updateFavorites(updatedFavorites);
          console.log(`[DEBUG] Updated auth context favorites`);
        }
      }
      
      // Force check favorite status after server operation
      if (!success) {
        throw new Error('API operation failed');
      }
    } catch (error) {
      console.error(`[DEBUG] Error toggling favorite:`, error);
      // Revert the state on error
      setIsFavorite(!newFavoriteState);
      alert('Failed to update favorites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Button text and accessibility labels
  const buttonText = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
  const ariaLabel = isFavorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <button
      data-testid="favorite-button"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isFavorite
          ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 ring-1 ring-red-300 dark:ring-red-800/50'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-700'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      aria-label={ariaLabel}
    >
      {isLoading ? (
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