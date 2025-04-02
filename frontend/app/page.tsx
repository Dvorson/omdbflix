'use client';

import React from 'react';
import { useState } from 'react';
import SearchForm from './components/SearchForm';
import MovieGrid from './components/MovieGrid';
import Pagination from './components/Pagination';
import { searchMedia } from './services/api';
import { Movie, SearchParams } from '@repo/types';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setLastSearchParams(params);

    try {
      const result = await searchMedia(params);
      
      if (result.Response === 'True') {
        setMovies(result.Search);
        setTotalResults(parseInt(result.totalResults, 10));
        setCurrentPage(params.page || 1);
      } else {
        setMovies([]);
        setTotalResults(0);
        setError(result.Error || 'No results found');
      }
    } catch (err) {
      setMovies([]);
      setTotalResults(0);
      setError('An error occurred while searching. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (lastSearchParams) {
      handleSearch({
        ...lastSearchParams,
        page,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-4">
        <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">Movie Explorer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Search for your favorite movies, series, and episodes
        </p>
      </div>

      <SearchForm onSearch={handleSearch} isLoading={loading} />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      <MovieGrid movies={movies} loading={loading} />

      {totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pb-8">
          <p>
            Showing {(currentPage - 1) * 10 + 1}-
            {Math.min(currentPage * 10, totalResults)} of {totalResults} results
          </p>
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
} 