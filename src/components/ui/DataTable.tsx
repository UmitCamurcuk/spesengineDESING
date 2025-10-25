import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Filter, User, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { useLanguage } from '../../contexts/LanguageContext';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  mobileRender?: (item: T) => React.ReactNode;
}

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'search';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onRowClick?: (item: T) => void;
  className?: string;
  pageSize?: number;
  showPagination?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  mode?: 'client' | 'server';
  totalItems?: number;
  currentPage?: number;
  currentPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  onPageSizeChange?: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
}) => {
  const { t } = useLanguage();
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(currentPage, safeTotalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          {t('pagination.showing')} {startItem} {t('pagination.to')} {endItem} {t('pagination.of')} {totalItems}{' '}
          {t('pagination.results')}
        </div>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('pagination.show')}:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="text-xs border border-input rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-muted-foreground">{t('pagination.per_page')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, safeTotalPages) }, (_, i) => {
            let pageNum;
            if (safeTotalPages <= 5) {
              pageNum = i + 1;
            } else if (safeCurrentPage <= 3) {
              pageNum = i + 1;
            } else if (safeCurrentPage >= safeTotalPages - 2) {
              pageNum = safeTotalPages - 4 + i;
            } else {
              pageNum = safeCurrentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-7 h-7 text-xs rounded-md transition-colors',
                  pageNum === safeCurrentPage ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
        >
          <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

interface UserInfoProps {
  name: string;
  email: string;
  date: string;
  avatarUrl?: string;
}

const formatUserInfoDate = (value: string): string => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  return value;
};

const UserInfo: React.FC<UserInfoProps> = ({ name, email, date, avatarUrl }) => (
  <div className="flex items-start space-x-2.5 text-left">
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-hover overflow-hidden flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <User className="h-4 w-4 text-white" />
      )}
    </div>
    <div className="min-w-0">
      <div className="text-xs font-medium text-foreground truncate">{name}</div>
      <div className="text-xs text-muted-foreground break-all">{email}</div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
        <span>{formatUserInfoDate(date)}</span>
      </div>
    </div>
  </div>
);

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  filters = [],
  onRowClick,
  className,
  pageSize = 10,
  showPagination = true,
  emptyState,
  mode = 'client',
  totalItems,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  filterValues,
  onFilterChange,
  onSortChange,
  sortKey,
  sortDirection,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const isServerMode = mode === 'server';

  const [internalSearch, setInternalSearch] = useState('');
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>({});
  const [internalSortKey, setInternalSortKey] = useState<string>('');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);

  useEffect(() => {
    if (!isServerMode) {
      setInternalPageSize(pageSize);
    }
  }, [pageSize, isServerMode]);

  const [serverSearchInput, setServerSearchInput] = useState(searchValue ?? '');

  useEffect(() => {
    if (isServerMode) {
      setServerSearchInput(searchValue ?? '');
    }
  }, [isServerMode, searchValue]);

  const resolvedSearch = isServerMode ? serverSearchInput : internalSearch;
  const resolvedFilters = isServerMode ? filterValues ?? {} : internalFilters;

  const isSortKeyControlled = sortKey !== undefined;
  const isSortDirectionControlled = sortDirection !== undefined;
  const resolvedSortKey = sortKey ?? internalSortKey;
  const resolvedSortDirection = sortDirection ?? internalSortDirection;

  const resolvedPage = isServerMode ? currentPage ?? 1 : internalPage;
  const resolvedPageSize = isServerMode ? currentPageSize ?? internalPageSize : internalPageSize;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.key as string;
    const direction = resolvedSortKey === key && resolvedSortDirection === 'asc' ? 'desc' : 'asc';

    if (isServerMode) {
      if (!isSortKeyControlled) {
        setInternalSortKey(key);
      }
      if (!isSortDirectionControlled) {
        setInternalSortDirection(direction);
      }
      onSortChange?.(key, direction);
    } else {
      setInternalSortKey(key);
      setInternalSortDirection(direction);
    }
  };

  const handlePageSizeChange = (value: number) => {
    if (isServerMode) {
      onPageSizeChange?.(value);
    } else {
      setInternalPageSize(value);
      setInternalPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1) return;
    if (isServerMode) {
      onPageChange?.(page);
    } else {
      setInternalPage(page);
    }
  };

  const handleSearchInputChange = (value: string) => {
    if (isServerMode) {
      setServerSearchInput(value);
    } else {
      setInternalSearch(value);
      setInternalPage(1);
    }
  };

  const triggerServerSearch = useCallback(() => {
    if (!isServerMode) {
      return;
    }
    onSearchChange?.(serverSearchInput.trim());
  }, [isServerMode, onSearchChange, serverSearchInput]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isServerMode) {
        triggerServerSearch();
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (isServerMode) {
      onFilterChange?.(key, value);
    } else {
      setInternalFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setInternalPage(1);
    }
  };

  useEffect(() => {
    if (!isServerMode) {
      setInternalPage(1);
    }
  }, [internalPageSize, isServerMode]);

  const filteredData = useMemo(() => {
    if (isServerMode) {
      return data;
    }

    return data.filter((item) => {
      if (resolvedSearch) {
        const normalized = resolvedSearch.toLowerCase();
        const searchableFields = columns
          .filter((col) => typeof item[col.key] === 'string')
          .map((col) => String(item[col.key]).toLowerCase());

        if (!searchableFields.some((field) => field.includes(normalized))) {
          return false;
        }
      }

      for (const [key, value] of Object.entries(resolvedFilters)) {
        if (value && item[key] !== value) {
          return false;
        }
      }

      return true;
    });
  }, [columns, data, isServerMode, resolvedFilters, resolvedSearch]);

  const sortedData = useMemo(() => {
    if (isServerMode || !resolvedSortKey) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[resolvedSortKey];
      const bVal = b[resolvedSortKey];

      if (aVal < bVal) return resolvedSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return resolvedSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, isServerMode, resolvedSortDirection, resolvedSortKey]);

  const paginatedData = useMemo(() => {
    if (isServerMode || !showPagination) {
      return sortedData;
    }

    const start = (resolvedPage - 1) * resolvedPageSize;
    const end = resolvedPage * resolvedPageSize;
    return sortedData.slice(start, end);
  }, [isServerMode, resolvedPage, resolvedPageSize, showPagination, sortedData]);

  const displayData = isServerMode ? data : paginatedData;
  const totalItemCount = isServerMode ? totalItems ?? data.length : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItemCount / Math.max(resolvedPageSize, 1)));

  if (loading && displayData.length === 0) {
    return (
      <div className={cn('bg-card rounded-lg border border-border overflow-hidden', className)}>
        <div className="animate-pulse">
          <div className="p-4 border-b border-border">
            <div className="h-9 bg-muted rounded-md w-1/3"></div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-muted rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!displayData.length) {
    return (
      <div className={cn('bg-card rounded-lg border border-border overflow-hidden', className)}>
        {(searchable || filters.length > 0) && (
          <div className="p-3.5 border-b border-border space-y-3 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {searchable && (
                <div className={cn('flex-1', isServerMode && 'flex items-center gap-2')}>
                  <Input
                    placeholder={searchPlaceholder}
                    value={resolvedSearch}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    leftIcon={<Search className="h-4 w-4" />}
                    className="h-10"
                  />
                  {isServerMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={triggerServerSearch}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {filters.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {filters.map((filter) => (
                    <div key={filter.key} className="flex-shrink-0">
                      {filter.type === 'select' ? (
                        <select
                          value={resolvedFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="px-3 py-2 pr-10 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-w-[120px] h-10"
                        >
                          <option value="">{filter.label}</option>
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          placeholder={filter.placeholder || filter.label}
                          value={resolvedFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="min-w-[120px]"
                        />
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="px-3 h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('ui.filter')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-10 text-center space-y-3">
          {emptyState?.icon && (
            <div className="flex justify-center text-muted-foreground">{emptyState.icon}</div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{emptyState?.title ?? t('common.no_results')}</h3>
            <p className="text-sm text-muted-foreground">
              {emptyState?.description ?? t('common.no_results_description')}
            </p>
          </div>
          {emptyState?.action}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-lg border border-border overflow-hidden flex flex-col h-full', className)}>
      {(searchable || filters.length > 0) && (
        <div className="p-3.5 border-b border-border space-y-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {searchable && (
              <div className={cn('flex-1', isServerMode && 'flex items-center gap-2')}>
                <Input
                  placeholder={searchPlaceholder}
                  value={resolvedSearch}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="h-10"
                />
                {isServerMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={triggerServerSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {filters.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <div key={filter.key} className="flex-shrink-0">
                    {filter.type === 'select' ? (
                      <select
                        value={resolvedFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="px-3 py-2 pr-10 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-w-[120px] h-10"
                      >
                        <option value="">{filter.label}</option>
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={filter.placeholder || filter.label}
                        value={resolvedFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="min-w-[120px]"
                      />
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="px-3 h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  {t('ui.filter')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden lg:block overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                <div
                  className={cn(
                    'flex items-center',
                    column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end',
                      column.sortable && 'cursor-pointer select-none',
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <span>{column.title}</span>
                    {column.sortable && resolvedSortKey === (column.key as string) && (
                      resolvedSortDirection === 'asc' ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {displayData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn('hover:bg-muted/60 transition-colors', onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'px-4 py-3 whitespace-nowrap text-sm text-foreground align-middle',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.render
                    ? column.render(item[column.key as keyof T], item)
                    : typeof item[column.key as keyof T] === 'boolean'
                      ? item[column.key as keyof T]
                          ? <Badge variant="success" size="sm">{t('common.yes')}</Badge>
                          : <Badge variant="secondary" size="sm">{t('common.no')}</Badge>
                        : String(item[column.key as keyof T] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden">
        <div className="divide-y divide-border">
          {displayData.map((item, index) => (
            <div key={index} className="p-4 space-y-3">
              {columns.map((column, colIndex) => (
                <div key={colIndex}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {column.title}
                  </div>
                  {column.mobileRender ? (
                    column.mobileRender(item)
                  ) : (
                    <div className="text-sm text-foreground">
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : typeof item[column.key as keyof T] === 'boolean'
                          ? t(item[column.key as keyof T] ? 'common.yes' : 'common.no')
                          : String(item[column.key as keyof T] ?? '-')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showPagination && totalItemCount > 0 && (
        <Pagination
          currentPage={resolvedPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={resolvedPageSize}
          totalItems={totalItemCount}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

export { UserInfo };
