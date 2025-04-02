'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MovieDetails } from '@repo/types';
import FavoriteButton from './FavoriteButton';

interface DetailClientProps {
  movie?: MovieDetails;
  error?: string;
}

export default function DetailClient({ movie, error }: DetailClientProps) {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  if (error || !movie) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <svg className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{error || 'Movie not found'}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">We couldn&apos;t find the movie you&apos;re looking for.</p>
        <button
          onClick={goBack}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Fallback image if no poster is available
  const posterSrc = movie.Poster && movie.Poster !== 'N/A'
    ? movie.Poster
    : '/placeholder.png';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={goBack}
        className="mb-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/3">
            <div className="relative h-96 md:h-full w-full">
              <Image
                src={posterSrc}
                alt={`${movie.Title} poster`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="p-6 md:p-8 md:w-2/3">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
              <h1 
                data-testid="movie-title"
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
              >
                {movie.Title}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {movie.Type.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 text-sm mb-6">
              {movie.Year && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{movie.Year}</span>}
              {movie.Rated && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{movie.Rated}</span>}
              {movie.Runtime && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{movie.Runtime}</span>}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Plot</h2>
              <p 
                data-testid="movie-plot"
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                {movie.Plot}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h2>
                <div className="space-y-3 text-sm">
                  {movie.Genre && <p><span className="font-medium text-gray-600 dark:text-gray-400">Genre:</span> {movie.Genre}</p>}
                  {movie.Director && <p data-testid="movie-director"><span className="font-medium text-gray-600 dark:text-gray-400">Director:</span> {movie.Director}</p>}
                  {movie.Writer && <p><span className="font-medium text-gray-600 dark:text-gray-400">Writer:</span> {movie.Writer}</p>}
                  {movie.Actors && <p><span className="font-medium text-gray-600 dark:text-gray-400">Actors:</span> {movie.Actors}</p>}
                  {movie.Language && <p><span className="font-medium text-gray-600 dark:text-gray-400">Language:</span> {movie.Language}</p>}
                  {movie.Country && <p><span className="font-medium text-gray-600 dark:text-gray-400">Country:</span> {movie.Country}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ratings</h2>
                <div className="space-y-3">
                  {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-yellow-800 dark:text-yellow-300 font-medium">IMDb Rating</span>
                      <span className="text-yellow-800 dark:text-yellow-300 font-bold">{movie.imdbRating}/10</span>
                    </div>
                  )}
                  {movie.Ratings && movie.Ratings.map((rating, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-gray-800 dark:text-gray-300 font-medium">{rating.Source}</span>
                      <span className="text-gray-800 dark:text-gray-300 font-bold">{rating.Value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <FavoriteButton movie={movie} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 