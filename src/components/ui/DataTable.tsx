import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Filter, User, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

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
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
      <div className="text-xs text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-7 h-7 text-xs rounded-md transition-colors',
                  pageNum === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const UserInfo: React.FC<{ name: string; email: string; date: string }> = ({ name, email, date }) => (
  <div className="flex items-center space-x-2.5">
    <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center">
      <User className="h-3.5 w-3.5 text-white" />
    </div>
    <div>
      <div className="text-xs font-medium text-foreground">{name}</div>
      <div className="text-xs text-muted-foreground">{email}</div>
      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
        <Calendar className="h-3 w-3 mr-0.5" />
        {new Date(date).toLocaleDateString()}
      </div>
    </div>
  </div>
);

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  filters = [],
  onRowClick,
  className,
  pageSize = 10,
  showPagination = true,
  emptyState
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.key as string;
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(direction);
  };

  const filteredData = data.filter(item => {
    if (searchTerm) {
      const searchableFields = columns
        .filter(col => typeof item[col.key] === 'string')
        .map(col => String(item[col.key]).toLowerCase());

      if (!searchableFields.some(field => field.includes(searchTerm.toLowerCase()))) {
        return false;
      }
    }

    for (const [key, value] of Object.entries(filterValues)) {
      if (value && item[key] !== value) {
        return false;
      }
    }

    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = showPagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="p-4 border-b border-gray-200">
            <div className="h-9 bg-gray-200 rounded-md w-1/3"></div>
          </div>
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-lg border border-border overflow-hidden', className)}>
      {(searchable || filters.length > 0) && (
        <div className="p-3.5 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {searchable && (
              <div className="flex-1">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
            )}

            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {filters.map(filter => (
                  <div key={filter.key} className="min-w-[140px]">
                    {filter.type === 'select' ? (
                      <select
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [filter.key]: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      >
                        <option value="">{filter.label}</option>
                        {filter.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={filter.placeholder || filter.label}
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [filter.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="px-2.5">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide',
                    column.sortable && 'cursor-pointer hover:bg-muted-hover select-none transition-colors duration-150',
                    column.width,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className={cn(
                    'flex items-center space-x-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3 transition-colors duration-150',
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1 transition-colors duration-150',
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="text-muted-foreground">
                    {emptyState?.icon && (
                      <div className="w-10 h-10 mx-auto mb-3 text-muted-foreground">
                        {emptyState.icon}
                      </div>
                    )}
                    <p className="text-sm font-medium">{emptyState?.title || 'No data found'}</p>
                    {emptyState?.description && (
                      <p className="text-xs text-muted-foreground mt-1">{emptyState.description}</p>
                    )}
                    {emptyState?.action && (
                      <div className="mt-3">{emptyState.action}</div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-muted transition-colors duration-150',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={cn(
                        'px-4 py-3 whitespace-nowrap text-sm text-foreground',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-border">
        {paginatedData.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <div className="text-muted-foreground">
              {emptyState?.icon && (
                <div className="w-10 h-10 mx-auto mb-3 text-muted-foreground">
                  {emptyState.icon}
                </div>
              )}
              <p className="text-sm font-medium">{emptyState?.title || 'No data found'}</p>
              {emptyState?.description && (
                <p className="text-xs text-muted-foreground mt-1">{emptyState.description}</p>
              )}
              {emptyState?.action && (
                <div className="mt-3">{emptyState.action}</div>
              )}
            </div>
          </div>
        ) : (
          paginatedData.map((item, index) => (
            <div
              key={index}
              className={cn(
                'p-3 hover:bg-muted transition-colors duration-150',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns[0].mobileRender ? columns[0].mobileRender(item) : (
                <div className="space-y-2.5">
                  {columns.slice(0, 3).map((column) => (
                    <div key={column.key as string}>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        {column.title}
                      </div>
                      <div className="text-sm text-foreground">
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={sortedData.length}
        />
      )}
    </div>
  );
}

export { UserInfo };
