/**
 * Pagination.tsx
 * ------------------------------------------------------------------
 * Reusable page-number control. Shows Previous/Next buttons plus a
 * condensed set of page numbers (with ellipses for large page counts)
 * so it stays usable even with many pages, without rendering 50+
 * buttons in a row.
 *
 * Purely presentational — owns no state itself. The parent page
 * supplies `currentPage`/`totalPages` and receives a callback when
 * the user picks a different page.
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Nothing to paginate — render nothing rather than a single useless
  // "Page 1 of 1" control.
  if (totalPages <= 1) {
    return null;
  }

  /**
   * getPageNumbers
   * ------------------------------------------------------------------
   * Builds a condensed list of page numbers to display, always
   * including the first page, last page, current page, and one
   * neighbor on each side of the current page — with `'...'` markers
   * standing in for any gaps. This keeps the control from rendering
   * an unwieldy 40+ buttons when totalPages is large.
   */
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 1; // how many neighbors around currentPage to show

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
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {pageNumbers.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`min-w-[2.25rem] rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-brand-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}