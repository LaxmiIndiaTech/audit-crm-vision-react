/**
 * React Hook for Standardized API Response Handling
 * 
 * This hook provides a consistent way to handle API responses across
 * all components in the CRM application.
 */

import { useState, useCallback } from 'react';
import { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiFailureResponse,
  isSuccessResponse 
} from '@/lib/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errors: string[];
  success: boolean;
  message: string | null;
}

export interface UseApiActions<T> {
  execute: (apiCall: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T>>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  handleResponse: (response: ApiResponse<T>) => void;
  handleError: (error: unknown) => void;
}

export type UseApiReturn<T> = UseApiState<T> & UseApiActions<T>;

/**
 * Hook for handling standardized API responses
 */
export const useApi = <T = any>(initialData?: T): UseApiReturn<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData || null,
    loading: false,
    error: null,
    errors: [],
    success: false,
    message: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
      error: loading ? null : prev.error,
      errors: loading ? [] : prev.errors,
      success: loading ? false : prev.success,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      errors: error ? [error] : [],
      success: false,
      loading: false,
    }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({
      ...prev,
      success,
      error: success ? null : prev.error,
      errors: success ? [] : prev.errors,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData || null,
      loading: false,
      error: null,
      errors: [],
      success: false,
      message: null,
    });
  }, [initialData]);

  const handleResponse = useCallback((response: ApiResponse<T>) => {
    if (isSuccessResponse(response)) {
      setState({
        data: response.data,
        loading: false,
        error: null,
        errors: [],
        success: true,
        message: response.message,
      });
    } else {
      setState(prev => ({
        ...prev,
        data: null,
        loading: false,
        error: response.errors.length > 0 ? response.errors[0] : 'An error occurred',
        errors: response.errors,
        success: false,
        message: null,
      }));
    }
  }, []);

  const handleError = useCallback((error: unknown) => {
    let errorMessage = 'An unexpected error occurred';
    let errors: string[] = [];

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
      errors = [errorMessage];
    } else if (typeof error === 'string') {
      errorMessage = error;
      errors = [error];
    }

    setState(prev => ({
      ...prev,
      data: null,
      loading: false,
      error: errorMessage,
      errors,
      success: false,
      message: null,
    }));
  }, []);

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    
    try {
      const response = await apiCall();
      handleResponse(response);
      return response;
    } catch (error) {
      handleError(error);
      
      // Return a failure response for consistency
      return {
        status: 'failure',
        data: {},
        errors: [error instanceof Error ? error.message : 'An unexpected error occurred'],
      };
    }
  }, [setLoading, handleResponse, handleError]);

  return {
    ...state,
    execute,
    setLoading,
    setError,
    setSuccess,
    reset,
    handleResponse,
    handleError,
  };
};

/**
 * Hook for handling form submissions with standardized API responses
 */
export const useApiForm = <T = any, TFormData = any>() => {
  const api = useApi<T>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = useCallback(async (
    formData: TFormData,
    apiCall: (data: TFormData) => Promise<ApiResponse<T>>,
    onSuccess?: (data: T, message: string) => void,
    onError?: (errors: string[]) => void
  ): Promise<ApiResponse<T>> => {
    setIsSubmitting(true);
    
    try {
      const response = await api.execute(() => apiCall(formData));
      
      if (isSuccessResponse(response)) {
        onSuccess?.(response.data, response.message);
      } else {
        onError?.(response.errors);
      }
      
      return response;
    } finally {
      setIsSubmitting(false);
    }
  }, [api]);

  return {
    ...api,
    isSubmitting,
    submitForm,
  };
};

/**
 * Hook for handling multiple API calls
 */
export const useMultipleApi = <T extends Record<string, any>>() => {
  const [state, setState] = useState<{
    loading: boolean;
    errors: string[];
    success: boolean;
    data: Partial<T>;
  }>({
    loading: false,
    errors: [],
    success: false,
    data: {},
  });

  const executeMultiple = useCallback(async (
    apiCalls: { [K in keyof T]: () => Promise<ApiResponse<T[K]>> }
  ): Promise<ApiResponse<T>> => {
    setState({ loading: true, errors: [], success: false, data: {} });
    
    try {
      const entries = Object.entries(apiCalls) as Array<[keyof T, () => Promise<ApiResponse<T[keyof T]>>]>;
      const promises = entries.map(async ([key, apiCall]) => {
        const response = await apiCall();
        return [key, response] as const;
      });
      
      const results = await Promise.all(promises);
      const data = {} as T;
      const errors: string[] = [];
      
      for (const [key, response] of results) {
        if (isSuccessResponse(response)) {
          data[key] = response.data;
        } else {
          errors.push(`${String(key)}: ${response.errors.join(', ')}`);
        }
      }
      
      if (errors.length > 0) {
        setState({ loading: false, errors, success: false, data: {} });
        return {
          status: 'failure',
          data: {},
          errors,
        };
      }
      
      setState({ loading: false, errors: [], success: true, data });
      return {
        status: 'success',
        data,
        message: 'All operations completed successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete operations';
      setState({ loading: false, errors: [errorMessage], success: false, data: {} });
      
      return {
        status: 'failure',
        data: {},
        errors: [errorMessage],
      };
    }
  }, []);

  return {
    ...state,
    executeMultiple,
  };
};