'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MovieDetails } from '@repo/types';
import FavoriteButton from './FavoriteButton';

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
            fill
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
        <FavoriteButton movie={movie} />
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