import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchMovies } from '../services/api';
import { MovieDetails, SearchParams, SearchResult } from '@repo/types';

interface UseMediaSearchResult {
  results: MovieDetails[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  searchQuery: string;
  searchType: string;
  searchYear: string;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: string) => void;
  setSearchYear: (year: string) => void;
  setCurrentPage: (page: number) => void;
  handleSearch: (params: SearchParams) => Promise<void>;
}

/**
 * Custom hook for media search functionality
 * Manages search state, pagination, and API integration
 */
export function useMediaSearch(): UseMediaSearchResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search state
  const [results, setResults] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams?.get('query') || ''
  );
  const [searchType, setSearchType] = useState<string>(
    searchParams?.get('type') || ''
  );
  const [searchYear, setSearchYear] = useState<string>(
    searchParams?.get('year') || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams?.get('page') || '1')
  );

  // Perform search when parameters change
  useEffect(() => {
    if (searchQuery) {
      handleSearch({
        query: searchQuery,
        type: searchType || undefined,
        year: searchYear || undefined,
        page: currentPage,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Update URL with search parameters
  useEffect(() => {
    if (searchQuery) {
      const params = new URLSearchParams();
      params.set('query', searchQuery);
      if (searchType) params.set('type', searchType);
      if (searchYear) params.set('year', searchYear);
      if (currentPage > 1) params.set('page', currentPage.toString());
      
      router.push(`/?${params.toString()}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchType, searchYear, currentPage]);

  /**
   * Execute media search with provided parameters
   */
  const handleSearch = useCallback(async (params: SearchParams): Promise<void> => {
    if (!params.query) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result: SearchResult = await searchMovies(params);
      
      // Handle "Conversion failed" SQL error specifically
      if (result.Response === 'False' && result.Error && result.Error.includes('Conversion failed when converting the varchar value')) {
        console.warn('Received SQL conversion error from API, trying again without year parameter');
        
        // If we have a year parameter, try again without it
        if (params.year) {
          const newParams = { ...params };
          delete newParams.year;
          
          // Clear any previous year selection in the UI
          setSearchYear('');
          
          // Try search again without the year
          return handleSearch(newParams);
        }
      }
      
      if (result.Response === 'True') {
        // Convert Movie[] to MovieDetails[] using type assertion
        // This is safe because we've made all the additional fields in MovieDetails optional
        const movieDetails = (result.Search || []) as unknown as MovieDetails[];
        setResults(movieDetails);
        setTotalResults(parseInt(result.totalResults || '0'));
      } else {
        setResults([]);
        setTotalResults(0);
        setError(result.Error || 'No results found');
      }
    } catch (err) {
      setResults([]);
      setTotalResults(0);
      setError((err as Error).message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  }, [setSearchYear]);

  return {
    results,
    loading,
    error,
    totalResults,
    currentPage,
    searchQuery,
    searchType,
    searchYear,
    setSearchQuery,
    setSearchType,
    setSearchYear,
    setCurrentPage,
    handleSearch,
  };
} 