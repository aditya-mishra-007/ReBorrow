import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      const isFirst = i === 1;
      const isLast = i === totalPages;
      const isNearCurrent = i >= currentPage - delta && i <= currentPage + delta;

      if (isFirst || isLast || isNearCurrent) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageNumbers.map((page, index) =>
        page === '...' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 w-9 items-center justify-center text-xs font-semibold text-gray-400 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
              currentPage === page
                ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/20'
                : 'border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-gray-50'
            }`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
