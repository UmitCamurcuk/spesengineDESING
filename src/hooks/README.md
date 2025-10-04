# Custom Hooks

This directory contains all the custom React hooks for the SpesEngine application.

## Hooks

### useApi
Hook for making API requests with loading and error states.

```tsx
const { data, loading, error, request } = useApi(apiCall);
```

### usePagination
Hook for managing pagination logic.

```tsx
const { currentPage, totalPages, paginatedData, setPage } = usePagination(data, options);
```

### useDebounce
Hook for debouncing a value.

```tsx
const debouncedValue = useDebounce(value, delay);
```

### useLocalStorage
Hook for interacting with localStorage.

```tsx
const [value, setValue] = useLocalStorage('key', initialValue);
```

### useMemoizedCallback
Enhanced useCallback with better memoization.

```tsx
const memoizedCallback = useMemoizedCallback(callback, deps);
```

### useVirtualization
Hook for virtualizing large lists.

```tsx
const { visibleItems, totalHeight, offsetY } = useVirtualization(items, options);
```

### useAccessibility
Hooks for accessibility features.

```tsx
const { announce } = useScreenReader();
const containerRef = useFocusTrap(isActive);
```

## Usage

```tsx
import { useApi, usePagination, useDebounce } from '@/hooks';

function MyComponent() {
  const { data, loading, error } = useApi(apiCall);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { currentPage, setPage } = usePagination(data, { pageSize: 10 });
  
  return (
    // Component JSX
  );
}
```

## Performance

All hooks are optimized for performance and include proper cleanup and memoization.
