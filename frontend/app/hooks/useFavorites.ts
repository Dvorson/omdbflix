import { useState, useEffect, useCallback } from 'react';
import { 
  getFavorites, 
  saveToFavorites, 
  removeFromFavorites, 
  isInFavorites 
} from '../services/api';
import { MovieDetails } from '@repo/types';

interface UseFavoritesResult {
  favorites: MovieDetails[];
  loading: boolean;
  addToFavorites: (movie: MovieDetails) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

/**
 * Custom hook for managing favorites
 * Handles adding, removing, and checking favorite status
 */
export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = getFavorites();
        setFavorites(storedFavorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    // Set up event listener for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'favorites') {
        loadFavorites();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Add a movie to favorites
   */
  const addToFavorites = useCallback((movie: MovieDetails) => {
    saveToFavorites(movie);
    setFavorites(prev => {
      // Check if the movie is already in favorites
      if (prev.some(item => item.imdbID === movie.imdbID)) {
        return prev;
      }
      return [...prev, movie];
    });
  }, []);

  /**
   * Remove a movie from favorites
   */
  const removeFavorite = useCallback((id: string) => {
    removeFromFavorites(id);
    setFavorites(prev => prev.filter(item => item.imdbID !== id));
  }, []);

  /**
   * Check if a movie is in favorites
   */
  const isFavorite = useCallback((id: string) => {
    return isInFavorites(id);
  }, []);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites: removeFavorite,
    isFavorite,
  };
} 