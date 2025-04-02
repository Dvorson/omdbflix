'use client';

import React from 'react';
import MovieCard from './MovieCard';
import { Movie, MovieDetails } from '@repo/types';

interface MovieGridProps {
  movies: Movie[] | MovieDetails[];
  loading: boolean;
}

const MovieGrid: React.FC<MovieGridProps> = ({ movies, loading }) => {
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500"></div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading movies...</div>
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h18M3 16h18" />
        </svg>
        <p className="text-lg text-gray-600 dark:text-gray-400">No movies found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 py-8">
      {movies.map((movie) => (
        // Type assertion is safe because MovieDetails extends Movie
        <MovieCard key={movie.imdbID} movie={movie as MovieDetails} />
      ))}
    </div>
  );
};

export default MovieGrid; 