import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const onPageChangeMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders pagination with correct number of pages', () => {
    render(
      <Pagination
        currentPage={2}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    // Should have 5 pages and previous/next buttons
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('highlights the current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    // Current page should have aria-current="page"
    const currentPage = screen.getByText('3');
    expect(currentPage.parentElement?.querySelector('[aria-current="page"]')).toBeInTheDocument();
  });

  it('calls onPageChange when a page button is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    // Click on page 4
    fireEvent.click(screen.getByText('4'));
    expect(onPageChangeMock).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange when previous/next buttons are clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    // Click on previous button
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChangeMock).toHaveBeenCalledWith(2);

    // Click on next button
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChangeMock).toHaveBeenCalledWith(4);
  });

  it('disables the previous button when on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables the next button when on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('disables all buttons when loading', () => {
    render(
      <Pagination
        currentPage={3}
        totalResults={50}
        onPageChange={onPageChangeMock}
        loading={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('does not render pagination when there is only one page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalResults={5}
        onPageChange={onPageChangeMock}
        loading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });
}); 