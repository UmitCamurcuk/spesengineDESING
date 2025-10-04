import { useCallback, useRef } from 'react';

/**
 * Enhanced useCallback that provides better memoization
 * and prevents unnecessary re-renders
 */
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const ref = useRef(callback);
  ref.current = callback;

  return useCallback(
    ((...args: any[]) => ref.current(...args)) as T,
    deps
  );
};

/**
 * Memoizes a value and only updates when dependencies change
 * Similar to useMemo but with better performance characteristics
 */
export const useStableValue = <T>(value: T, deps: React.DependencyList): T => {
  const ref = useRef<T>(value);
  
  // Only update if dependencies have changed
  if (JSON.stringify(deps) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
};
