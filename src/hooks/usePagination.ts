import { useState, useCallback, useMemo } from 'react';

// Pagination state interface
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Pagination hook options
interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  maxLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

// Pagination hook
export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 20,
    maxLimit = 100,
    onPageChange,
    onLimitChange,
  } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Update pagination state
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Calculate derived values
      newState.totalPages = Math.ceil(newState.total / newState.limit);
      newState.hasNext = newState.page < newState.totalPages;
      newState.hasPrev = newState.page > 1;
      
      return newState;
    });
  }, []);

  // Set total items
  const setTotal = useCallback((total: number) => {
    updatePagination({ total });
  }, [updatePagination]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      setState(prev => ({ ...prev, page }));
      onPageChange?.(page);
    }
  }, [state.totalPages, onPageChange]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (state.hasNext) {
      goToPage(state.page + 1);
    }
  }, [state.hasNext, state.page, goToPage]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (state.hasPrev) {
      goToPage(state.page - 1);
    }
  }, [state.hasPrev, state.page, goToPage]);

  // Go to first page
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // Go to last page
  const lastPage = useCallback(() => {
    goToPage(state.totalPages);
  }, [goToPage, state.totalPages]);

  // Change page size
  const setPageSize = useCallback((limit: number) => {
    const newLimit = Math.min(Math.max(1, limit), maxLimit);
    setState(prev => ({ ...prev, limit: newLimit, page: 1 }));
    onLimitChange?.(newLimit);
  }, [maxLimit, onLimitChange]);

  // Reset pagination
  const reset = useCallback(() => {
    setState({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, [initialPage, initialLimit]);

  // Get page range for pagination display
  const getPageRange = useCallback((range: number = 5) => {
    const { page, totalPages } = state;
    const halfRange = Math.floor(range / 2);
    
    let start = Math.max(1, page - halfRange);
    let end = Math.min(totalPages, page + halfRange);
    
    // Adjust if we're near the beginning or end
    if (end - start + 1 < range) {
      if (start === 1) {
        end = Math.min(totalPages, start + range - 1);
      } else {
        start = Math.max(1, end - range + 1);
      }
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [state]);

  // Get pagination info
  const getPaginationInfo = useCallback(() => {
    const { page, limit, total } = state;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);
    
    return {
      startItem,
      endItem,
      total,
      showing: `${startItem}-${endItem} of ${total}`,
    };
  }, [state]);

  // Memoized pagination state
  const paginationState = useMemo(() => state, [state]);

  return {
    // State
    ...paginationState,
    
    // Actions
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotal,
    updatePagination,
    reset,
    
    // Utilities
    getPageRange,
    getPaginationInfo,
  };
};

// Pagination component props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

// Pagination component hook
export const usePaginationComponent = (props: PaginationProps) => {
  const {
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPrevNext = true,
    maxVisiblePages = 5,
  } = props;

  // Get visible page numbers
  const getVisiblePages = useCallback(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisiblePages - 1);
      } else {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  // Check if we should show ellipsis
  const shouldShowEllipsis = useCallback((position: 'start' | 'end') => {
    const visiblePages = getVisiblePages();
    
    if (position === 'start') {
      return visiblePages[0] > 1;
    } else {
      return visiblePages[visiblePages.length - 1] < totalPages;
    }
  }, [getVisiblePages, totalPages]);

  // Navigation handlers
  const handleFirstPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  }, [currentPage, onPageChange]);

  const handleLastPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageClick = useCallback((page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange]);

  return {
    visiblePages: getVisiblePages(),
    shouldShowEllipsis,
    handleFirstPage,
    handleLastPage,
    handlePrevPage,
    handleNextPage,
    handlePageClick,
    canGoFirst: currentPage > 1,
    canGoLast: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    canGoNext: currentPage < totalPages,
  };
};
