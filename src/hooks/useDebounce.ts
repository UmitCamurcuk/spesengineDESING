import { useState, useEffect, useCallback, useRef } from 'react';

// Debounce hook for values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Debounce hook for callbacks
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, ...deps]
  ) as T;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Debounce hook for async functions
export const useDebouncedAsyncCallback = <T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const [isPending, setIsPending] = useState(false);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    async (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            setIsPending(true);
            const result = await callbackRef.current(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            setIsPending(false);
          }
        }, delay);
      });
    },
    [delay, ...deps]
  ) as T;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Debounce hook with immediate execution option
export const useDebounceWithImmediate = <T>(
  value: T,
  delay: number,
  immediate: boolean = false
): { debouncedValue: T; isDebouncing: boolean } => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (immediate && !isDebouncing) {
      setDebouncedValue(value);
      return;
    }

    setIsDebouncing(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, immediate, isDebouncing]);

  return { debouncedValue, isDebouncing };
};

// Debounce hook for search
export const useSearchDebounce = (
  searchTerm: string,
  delay: number = 300,
  minLength: number = 2
) => {
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (debouncedSearchTerm.length >= minLength) {
      setIsSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, minLength]);

  return {
    debouncedSearchTerm,
    isSearching,
    shouldSearch: debouncedSearchTerm.length >= minLength,
  };
};

// Debounce hook for form validation
export const useValidationDebounce = (
  value: string,
  validator: (value: string) => boolean | string,
  delay: number = 500
) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: true });

  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (debouncedValue) {
      setIsValidating(true);
      
      const timer = setTimeout(() => {
        const result = validator(debouncedValue);
        
        if (typeof result === 'boolean') {
          setValidationResult({ isValid: result });
        } else {
          setValidationResult({ isValid: false, error: result });
        }
        
        setIsValidating(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setValidationResult({ isValid: true });
      setIsValidating(false);
    }
  }, [debouncedValue, validator]);

  return {
    debouncedValue,
    isValidating,
    validationResult,
  };
};

// Debounce hook for API calls
export const useApiDebounce = <T>(
  apiCall: (value: T) => Promise<any>,
  delay: number = 300
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const debouncedApiCall = useDebouncedCallback(
    async (value: T) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiCall(value);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    delay
  );

  return {
    debouncedApiCall,
    isLoading,
    data,
    error,
  };
};

