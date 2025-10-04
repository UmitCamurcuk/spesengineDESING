// Custom Hooks Library Export
export * from './useApi';
export * from './usePagination';
export * from './useDebounce';
export * from './useLocalStorage';

// Re-export commonly used hooks for convenience
export {
  useApi,
  usePaginatedApi,
  useMutation,
} from './useApi';

export {
  usePagination,
  usePaginationComponent,
} from './usePagination';

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedAsyncCallback,
  useDebounceWithImmediate,
  useSearchDebounce,
  useValidationDebounce,
  useApiDebounce,
} from './useDebounce';

export {
  useLocalStorage,
  useSessionStorage,
  useStorageWithValidation,
  useStorageWithExpiration,
  useEncryptedStorage,
} from './useLocalStorage';
