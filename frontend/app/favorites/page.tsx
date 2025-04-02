'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavorites, removeFavorite, getMovieDetails } from '../services/api';
import { MovieDetails } from '@repo/types';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<MovieDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchFavoriteDetails = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setFavorites([]);
        return;
      }
      setIsLoading(true);
      try {
        const favoriteIds = await getFavorites();
        const favoriteDetailsPromises = favoriteIds.map(id => getMovieDetails(id));
        const favoriteDetails = await Promise.all(favoriteDetailsPromises);
        setFavorites(favoriteDetails);
      } catch (error) {
        console.error('Error fetching favorite details:', error);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchFavoriteDetails();
    }

  }, [isAuthenticated, isAuthLoading]);

  const handleRemoveFavorite = async (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.imdbID !== id));
    try {
      await removeFavorite(id);
    } catch (error) {
      console.error(`Failed to remove favorite ${id}:`, error);
      alert('Failed to remove favorite. Please try again.');
      if (!isAuthLoading && isAuthenticated) {
          const favoriteIds = await getFavorites();
          const favoriteDetailsPromises = favoriteIds.map(id => getMovieDetails(id));
          const favoriteDetails = await Promise.all(favoriteDetailsPromises);
          setFavorites(favoriteDetails);
      }
    }
  };

  if (isAuthLoading || isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading favorites...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="favorites-container">
        <p>Please <Link href="#" onClick={(e) => { e.preventDefault(); }} className="text-blue-600 hover:underline">sign in</Link> to view your favorites.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Favorites</h1>
      {favorites.length === 0 ? (
        <div>
          <p>You haven&apos;t added any favorites yet.</p>
          <p className="mt-2">Go search for some movies</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map((movie) => (
            <div key={movie.imdbID} className="group relative overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
              <Link href={`/${movie.imdbID}`}>
                <Image 
                  src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder-image.png'} 
                  alt={movie.Title} 
                  width={300} 
                  height={450} 
                  className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-semibold text-white">{movie.Title}</h3>
                    <p className="text-sm text-gray-300">{movie.Year}</p>
                  </div>
                </div>
              </Link>
              <button 
                onClick={() => handleRemoveFavorite(movie.imdbID)}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-red-600"
                aria-label="Remove from favorites"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 