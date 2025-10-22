import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface ServerTableSort {
  key: string;
  direction: SortDirection;
}

export interface ServerTableFetchParams<F extends Record<string, any>> {
  page: number;
  pageSize: number;
  search?: string;
  filters: F;
  sort?: ServerTableSort | null;
}

export interface ServerTableFetchResult<T> {
  items: T[];
  totalItems: number;
}

export interface UseServerTableOptions<T, F extends Record<string, any>> {
  fetcher: (params: ServerTableFetchParams<F>) => Promise<ServerTableFetchResult<T>>;
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialFilters?: F;
  initialSort?: ServerTableSort | null;
}

export interface UseServerTableReturn<T, F extends Record<string, any>> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  search: string;
  filters: F;
  sort: ServerTableSort | null;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setFilters: (updater: Partial<F> | ((prev: F) => F)) => void;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  resetFilters: () => void;
  setSort: (sort: ServerTableSort | null) => void;
  refresh: () => Promise<void>;
}

export function useServerTable<T, F extends Record<string, any> = Record<string, string>>(
  options: UseServerTableOptions<T, F>,
): UseServerTableReturn<T, F> {
  const {
    fetcher,
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialFilters,
    initialSort = null,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearchState] = useState(initialSearch);
  const [filters, setFiltersState] = useState<F>(initialFilters ?? ({} as F));
  const [sort, setSortState] = useState<ServerTableSort | null>(initialSort);
  const [items, setItems] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1))), [pageSize, totalItems]);

  const executeFetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher({
        page,
        pageSize,
        search: search.trim().length > 0 ? search.trim() : undefined,
        filters,
        sort,
      });
      setItems(result.items);
      setTotalItems(result.totalItems);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Veriler yüklenirken bir hata oluştu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetcher, filters, page, pageSize, search, sort]);

  useEffect(() => {
    void executeFetch();
  }, [executeFetch]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageSize = useCallback((nextPageSize: number) => {
    const normalized = Math.max(1, nextPageSize);
    setPageSizeState(normalized);
    setPageState(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setFilters = useCallback(
    (updater: Partial<F> | ((prev: F) => F)) => {
      setFiltersState((prev) => {
        let next: F;
        if (typeof updater === 'function') {
          next = (updater as (current: F) => F)(prev);
        } else {
          next = { ...prev, ...updater };
        }
        return next;
      });
      setPageState(1);
    },
    [],
  );

  const setFilter = useCallback(
    <K extends keyof F>(key: K, value: F[K]) => {
      setFiltersState((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
      setPageState(1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters ?? ({} as F));
    setPageState(1);
  }, [initialFilters]);

  const setSort = useCallback((nextSort: ServerTableSort | null) => {
    setSortState(nextSort);
    setPageState(1);
  }, []);

  const refresh = useCallback(async () => {
    await executeFetch();
  }, [executeFetch]);

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    loading,
    error,
    search,
    filters,
    sort,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    setFilter,
    resetFilters,
    setSort,
    refresh,
  };
}
