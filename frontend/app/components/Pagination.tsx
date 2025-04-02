'use client';

interface PaginationProps {
  currentPage: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalResults,
  onPageChange,
  loading,
}) => {
  const resultsPerPage = 10;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  // Calculate the range of pages to show
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <nav className="flex justify-center items-center">
      <ul className="flex flex-wrap gap-2">
        {/* Previous button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            &lt;
          </button>
        </li>

        {/* Page numbers */}
        {pages.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              disabled={page === currentPage || loading}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150 ${
                page === currentPage
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}

        {/* Next button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            &gt;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;