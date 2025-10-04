import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ApiError } from '../api/types/api.types';
import { logger } from '../utils/logger';

// API hook state interface
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
}

// API hook options
interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

// Generic API hook
export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    retry = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const [retryAttempts, setRetryAttempts] = useState(0);

  // Execute API call
  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction(...args);
      
      setState({
        data: response.data,
        loading: false,
        error: null,
        success: true,
      });

      onSuccess?.(response.data);
      logger.info('API call successful', { data: response.data });
      
      return response;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.status || 0,
        details: error.details,
        timestamp: new Date().toISOString(),
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      onError?.(apiError);
      logger.error('API call failed', { error: apiError });

      // Retry logic
      if (retry && retryAttempts < retryCount) {
        setRetryAttempts(prev => prev + 1);
        setTimeout(() => {
          execute(...args);
        }, retryDelay * retryAttempts);
      }

      throw apiError;
    }
  }, [apiFunction, onSuccess, onError, retry, retryCount, retryDelay, retryAttempts]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
    setRetryAttempts(0);
  }, []);

  // Execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
    retryAttempts,
  };
};

// Paginated API hook
export const usePaginatedApi = <T = any>(
  apiFunction: (params: any) => Promise<ApiResponse<{ data: T[]; pagination: any }>>,
  options: UseApiOptions = {}
) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    retry = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseApiState<T[]>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [params, setParams] = useState<any>({});

  // Execute API call
  const execute = useCallback(async (newParams?: any) => {
    const currentParams = { ...params, ...newParams };
    setParams(currentParams);
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction(currentParams);
      
      setState({
        data: response.data.data,
        loading: false,
        error: null,
        success: true,
      });

      setPagination(response.data.pagination);
      onSuccess?.(response.data);
      
      return response;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.status || 0,
        details: error.details,
        timestamp: new Date().toISOString(),
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      onError?.(apiError);
      throw apiError;
    }
  }, [apiFunction, params, onSuccess, onError]);

  // Load next page
  const loadNext = useCallback(() => {
    if (pagination.hasNext) {
      execute({ page: pagination.page + 1 });
    }
  }, [execute, pagination.page, pagination.hasNext]);

  // Load previous page
  const loadPrev = useCallback(() => {
    if (pagination.hasPrev) {
      execute({ page: pagination.page - 1 });
    }
  }, [execute, pagination.page, pagination.hasPrev]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      execute({ page });
    }
  }, [execute, pagination.totalPages]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
    setParams({});
  }, []);

  // Execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    pagination,
    execute,
    loadNext,
    loadPrev,
    goToPage,
    reset,
  };
};

// Mutation hook for POST/PUT/DELETE operations
export const useMutation = <T = any, P = any>(
  mutationFunction: (data: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) => {
  const {
    onSuccess,
    onError,
    retry = false,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const [retryAttempts, setRetryAttempts] = useState(0);

  // Execute mutation
  const mutate = useCallback(async (data: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await mutationFunction(data);
      
      setState({
        data: response.data,
        loading: false,
        error: null,
        success: true,
      });

      onSuccess?.(response.data);
      logger.info('Mutation successful', { data: response.data });
      
      return response;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.status || 0,
        details: error.details,
        timestamp: new Date().toISOString(),
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      onError?.(apiError);
      logger.error('Mutation failed', { error: apiError });

      // Retry logic
      if (retry && retryAttempts < retryCount) {
        setRetryAttempts(prev => prev + 1);
        setTimeout(() => {
          mutate(data);
        }, retryDelay * retryAttempts);
      }

      throw apiError;
    }
  }, [mutationFunction, onSuccess, onError, retry, retryCount, retryDelay, retryAttempts]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
    setRetryAttempts(0);
  }, []);

  return {
    ...state,
    mutate,
    reset,
    retryAttempts,
  };
};
