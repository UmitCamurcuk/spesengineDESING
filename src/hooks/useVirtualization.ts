import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualizationResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  visibleItems: number[];
}

/**
 * Hook for virtualizing large lists to improve performance
 */
export const useVirtualization = (
  items: any[],
  options: VirtualizationOptions
): VirtualizationResult => {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );

  const offsetY = startIndex * itemHeight;
  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    // This would be attached to the scrollable container
    // Implementation depends on your specific use case
  }, []);

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleItems,
  };
};

/**
 * Hook for debounced search with performance optimization
 */
export const useOptimizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceMs: number = 300
): T[] => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;

    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
          typeof value === 'string' && 
          value.toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);
};
