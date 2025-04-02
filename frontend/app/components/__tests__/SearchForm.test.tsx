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
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    
    // Show filters to check if type and year are displayed
    fireEvent.click(screen.getByText('Show filters'));
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
  });

  // Test 2: Should handle input changes
  it('updates input values when user types', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Show filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Get form elements
    const queryInput = screen.getByTestId('search-input');
    const typeSelect = screen.getByLabelText('Type');
    const yearInput = screen.getByLabelText('Year');
    
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
    
    // Show filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Get form elements
    const queryInput = screen.getByTestId('search-input');
    const typeSelect = screen.getByLabelText('Type');
    const yearInput = screen.getByLabelText('Year');
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
      year: '2010'
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
    const submitButton = screen.getByTestId('search-button');
    
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
    const queryInput = screen.getByTestId('search-input');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Fill only the query
    fireEvent.change(queryInput, { target: { value: 'star wars' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if onSearch was called with the correct params
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars'
    });
  });
  
  // Test 7: Should validate year input (only accept 4-digit years)
  it('validates that year is a 4-digit number', () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Show filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Get form elements
    const queryInput = screen.getByTestId('search-input');
    const yearInput = screen.getByLabelText('Year');
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    // Fill the query and an invalid year
    fireEvent.change(queryInput, { target: { value: 'star wars' } });
    fireEvent.change(yearInput, { target: { value: '20' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if onSearch was called with the correct params (invalid year shouldn't be sent)
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars'
    });
    
    // Clear the mock function
    mockOnSearch.mockClear();
    
    // Now test with a valid year
    fireEvent.change(yearInput, { target: { value: '1977' } });
    fireEvent.click(submitButton);
    
    // Check onSearch was called with the correct params
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'star wars',
      year: '1977'
    });
  });

  test('includes year parameter in search when selected', async () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} isLoading={false} />);
    
    // Show advanced filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Enter search query
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Star Wars' } });
    
    // Select year 2015
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2015' } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Verify onSearch was called with correct parameters
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({
      query: 'Star Wars',
      year: '2015'
    }));
  });

  test('clears year filter when Clear All is clicked', () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} isLoading={false} />);
    
    // Show advanced filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Enter search query
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Star Wars' } });
    
    // Select year 2015
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2015' } });
    
    // Click Clear All
    fireEvent.click(screen.getByText('Clear All'));
    
    // Check that year select is cleared
    expect(screen.getByLabelText('Year')).toHaveValue('');
    
    // Input should also be cleared
    expect(screen.getByTestId('search-input')).toHaveValue('');
  });

  test('correctly displays all available years from current year to 1900', () => {
    const currentYear = new Date().getFullYear();
    render(<SearchForm onSearch={jest.fn()} isLoading={false} />);
    
    // Show advanced filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Open the year dropdown
    const yearSelect = screen.getByLabelText('Year');
    
    // Check if correct number of options is generated
    expect(yearSelect.querySelectorAll('option')).toHaveLength((currentYear - 1900) + 2); // +1 for "Any Year" option and +1 because range is inclusive
    
    // Check first year is current year
    const options = Array.from(yearSelect.querySelectorAll('option'));
    expect(options[1]).toHaveValue(currentYear.toString());
    
    // Check last year is 1900
    expect(options[options.length - 1]).toHaveValue('1900');
  });

  test('handles malformed years gracefully on the UI', async () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);
    
    // Show advanced filters
    fireEvent.click(screen.getByText('Show filters'));
    
    // Enter search query
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Star Wars' } });
    
    // Manually set a malformed year (this wouldn't happen through the UI normally)
    const yearSelect = screen.getByLabelText('Year');
    fireEvent.change(yearSelect, { target: { value: 'invalid' } });
    
    // Submit form
    fireEvent.click(screen.getByTestId('search-button'));
    
    // onSearch should be called with just the query, since the year filter is invalid
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'Star Wars'
    });
  });
}); 