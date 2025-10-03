import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  className,
}: TableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    
    const key = column.key as string;
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white shadow-sm rounded-xl border border-gray-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/60 bg-gray-50/50">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200/60">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="px-6 py-4">
                <div className="grid grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white shadow-sm rounded-xl border border-gray-200/60 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/60">
          <thead className="bg-gray-50/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    'px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100/50 select-none transition-colors duration-200',
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
                            'h-3 w-3 transition-colors duration-200',
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1 transition-colors duration-200',
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No data found</p>
                    <p className="text-xs text-gray-400 mt-1">Get started by creating your first item</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-gray-50/50 transition-colors duration-200',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key as string} 
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm',
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
    </div>
  );
}