'use client';

import { useState, useCallback, useRef } from 'react';

interface UseAsyncOperationOptions {
  timeout?: number; // in milliseconds
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
}

interface AsyncOperationState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isTimeout: boolean;
}

/**
 * Hook for managing async operations with timeout and error handling
 * Prevents infinite loading states and provides fallback UI support
 */
export function useAsyncOperation<T>(
  options: UseAsyncOperationOptions = {}
) {
  const { timeout = 30000, onError, onSuccess } = options;
  
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isTimeout: false,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | null> => {
      setState({ data: null, error: null, isLoading: true, isTimeout: false });
      
      // Set timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setState(prev => ({ ...prev, isLoading: false, isTimeout: true, error: new Error('Operation timed out') }));
          onError?.(new Error('Operation timed out'));
        }
      }, timeout);
      
      try {
        const result = await asyncFn();
        
        if (isMounted.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setState({ data: result, error: null, isLoading: false, isTimeout: false });
          onSuccess?.(result);
          return result;
        }
        return null;
      } catch (error) {
        if (isMounted.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          const err = error instanceof Error ? error : new Error('Operation failed');
          setState({ data: null, error: err, isLoading: false, isTimeout: false });
          onError?.(err);
        }
        return null;
      }
    },
    [timeout, onError, onSuccess]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({ data: null, error: null, isLoading: false, isTimeout: false });
  }, []);

  // Cleanup on unmount
  useState(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  });

  return {
    ...state,
    execute,
    reset,
    hasError: !!state.error,
    isIdle: !state.isLoading && !state.error && !state.data,
  };
}
