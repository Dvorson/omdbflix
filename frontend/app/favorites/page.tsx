'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFavorites, removeFromFavorites } from '../services/api';
import { MovieDetails } from '@repo/types';
import Image from 'next/image';
import React from 'react';

export default function Favorites() {
  const [favorites, setFavorites] = useState<MovieDetails[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setFavorites(getFavorites());
  }, []);

  const handleRemoveFavorite = (id: string) => {
    removeFromFavorites(id);
    setFavorites(getFavorites());
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Your Favorites</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Movies and series you&apos;ve saved
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven&apos;t added any favorites yet.</p>
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go search for some movies
            <svg className="h-5 w-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {favorites.map((movie) => (
            <div
              key={movie.imdbID}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/6 relative">
                  <div className="relative h-48 sm:h-full w-full">
                    <Image
                      src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png'}
                      alt={`${movie.Title} poster`}
                      fill
                      sizes="(max-width: 768px) 100vw, 16vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex-1">
                  <div className="flex justify-between">
                    <Link
                      href={`/${movie.imdbID}`}
                      className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {movie.Title}
                    </Link>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded h-fit">
                      {movie.Type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-2 mb-4">
                    <span className="mr-4">{movie.Year}</span>
                    <span className="mr-4">{movie.Rated}</span>
                    <span>{movie.Runtime}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                    {movie.Plot}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{movie.imdbRating}/10</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(movie.imdbID)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm"
                    >
                      Remove from favorites
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 