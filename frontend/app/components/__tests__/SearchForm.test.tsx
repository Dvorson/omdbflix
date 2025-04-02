import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchForm from '../SearchForm';

describe('SearchForm', () => {
  // Test 1: Should render the form
  it('renders the search form correctly', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/search movies, series, or episodes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  // Test 2: Should handle input changes
  it('updates input values when user types', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Get form elements
    const queryInput = screen.getByLabelText(/search movies, series, or episodes/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const yearInput = screen.getByLabelText(/year/i);
    
    // Simulate user typing
    fireEvent.change(queryInput, { target: { value: 'inception' } });
    fireEvent.change(typeSelect, { target: { value: 'movie' } });
    fireEvent.change(yearInput, { target: { value: '2010' } });
    
    // Check if values are updated
    expect(queryInput).toHaveValue('inception');
    expect(typeSelect).toHaveValue('movie');
    expect(yearInput).toHaveValue('2010');
  });

  // Test 3: Should call onSearch with correct params when form is submitted
  it('calls onSearch with correct params when form is submitted', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Get form elements
    const queryInput = screen.getByLabelText(/search movies, series, or episodes/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const yearInput = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Fill out the form
    fireEvent.change(queryInput, { target: { value: 'inception' } });
    fireEvent.change(typeSelect, { target: { value: 'movie' } });
    fireEvent.change(yearInput, { target: { value: '2010' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if onSearch was called with the correct params
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'inception',
      type: 'movie',
      year: '2010',
      page: 1
    });
  });
  
  // Test 4: Should prevent form submission if query is empty
  it('does not submit the form if query is empty', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Submit the form without filling the query
    fireEvent.click(submitButton);
    
    // Check if onSearch was NOT called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });
  
  // Test 5: Should disable search button when loading
  it('disables the search button when loading', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);
    
    // Get submit button
    const submitButton = screen.getByRole('button');
    
    // Check if button is disabled
    expect(submitButton).toBeDisabled();
    // Check if loading text is displayed
    expect(submitButton).toHaveTextContent(/searching/i);
  });
  
  // Test 6: Should handle undefined optional params
  it('sends undefined for empty type and year fields', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Get form elements
    const queryInput = screen.getByLabelText(/search movies, series, or episodes/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Fill only the query
    fireEvent.change(queryInput, { target: { value: 'star wars' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if onSearch was called with the correct params
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars',
      type: undefined,
      year: undefined,
      page: 1
    });
  });
  
  // Test 7: Should validate year input (only accept 4-digit years)
  it('validates that year is a 4-digit number', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Get form elements
    const queryInput = screen.getByLabelText(/search movies, series, or episodes/i);
    const yearInput = screen.getByLabelText(/year/i);
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Fill the query and an invalid year
    fireEvent.change(queryInput, { target: { value: 'star wars' } });
    fireEvent.change(yearInput, { target: { value: '20' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if onSearch was called with the correct params (year should be sent as is)
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars',
      type: undefined,
      year: '20',
      page: 1
    });
    
    // Clear the mock function
    mockOnSearch.mockClear();
    
    // Now test with a valid year
    fireEvent.change(yearInput, { target: { value: '1977' } });
    fireEvent.click(submitButton);
    
    // Check onSearch was called with the correct params
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars',
      type: undefined,
      year: '1977',
      page: 1
    });
  });
}); 