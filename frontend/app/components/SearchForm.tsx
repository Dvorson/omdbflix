'use client';

import React, { useState } from 'react';
import { SearchParams } from '@repo/types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => Promise<void>;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [advancedVisible, setAdvancedVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    const params: SearchParams = { query: searchTerm.trim() };
    
    if (type) params.type = type;
    if (year) params.year = year;
    
    await onSearch(params);
  };

  // Generate year options (current year down to 1900)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="sm:flex sm:items-center sm:gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for movies, series, episodes..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              data-testid="search-input"
              aria-label="Search term"
              required
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600 sm:mt-0 sm:w-auto"
            data-testid="search-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setAdvancedVisible(!advancedVisible)}
            className="mt-2 flex items-center text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 sm:ml-4 sm:mt-0"
            aria-expanded={advancedVisible}
          >
            {advancedVisible ? 'Hide' : 'Show'} filters
            <svg 
              className={`ml-1 h-4 w-4 transform transition-transform ${advancedVisible ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {advancedVisible && (
          <div className="grid gap-4 pt-2 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                aria-label="Select content type"
              >
                <option value="">All Types</option>
                <option value="movie">Movies</option>
                <option value="series">TV Series</option>
                <option value="episode">Episodes</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Year
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                aria-label="Select release year"
              >
                <option value="">Any Year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end sm:col-span-2 md:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setType('');
                  setYear('');
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchForm; 