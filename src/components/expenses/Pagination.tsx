import type { FC } from 'react';
import type { Pagination as PaginationType } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

/**
 * Component for navigating between pages of expense list.
 */
const Pagination: FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, total_pages, total_items, limit } = pagination;

  // Calculate item range for current page
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total_items);

  /**
   * Generates array of page numbers to display
   * Shows current page, adjacent pages, and ellipsis for gaps
   */
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (total_pages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, page - 1);
      let end = Math.min(total_pages - 1, page + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < total_pages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (total_pages > 1) {
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();
  const isFirstPage = page === 1;
  const isLastPage = page === total_pages;

  return (
    <div className="mt-6 flex flex-col items-center gap-4 border-t pt-4 sm:flex-row sm:justify-between">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Wyświetlanie <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> z{' '}
        <span className="font-medium">{total_items}</span> wydatków
      </div>

      {/* Pagination controls */}
      <nav aria-label="Paginacja wydatków" className="flex items-center gap-1">
        {/* First page - hidden on mobile */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          aria-label="Pierwsza strona"
          className="hidden sm:inline-flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const pageNumber = pageNum as number;
            const isCurrentPage = pageNumber === page;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? 'default' : 'outline'}
                size="icon"
                onClick={() => onPageChange(pageNumber)}
                aria-label={`Strona ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                className={isCurrentPage ? 'pointer-events-none' : ''}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Następna strona"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page - hidden on mobile */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(total_pages)}
          disabled={isLastPage}
          aria-label="Ostatnia strona"
          className="hidden sm:inline-flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;

