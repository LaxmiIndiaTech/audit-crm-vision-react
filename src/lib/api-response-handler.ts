/**
 * Standardized API Response Handler
 * 
 * This module provides utilities for handling standardized API responses
 * across the entire CRM application.
 */

import { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiFailureResponse,
  isSuccessResponse,
  isFailureResponse,
  createSuccessResponse,
  createFailureResponse,
  ApiError 
} from './api';

// Hook for handling API responses in React components
export interface UseApiResponseState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errors: string[];
  success: boolean;
  message: string | null;
}

// Response handler for React components
export class ApiResponseHandler<T> {
  public readonly state: UseApiResponseState<T>;

  constructor(initialState?: Partial<UseApiResponseState<T>>) {
    this.state = {
      data: null,
      loading: false,
      error: null,
      errors: [],
      success: false,
      message: null,
      ...initialState,
    };
  }

  // Handle loading state
  setLoading(loading: boolean): UseApiResponseState<T> {
    return {
      ...this.state,
      loading,
      error: loading ? null : this.state.error,
      errors: loading ? [] : this.state.errors,
    };
  }

  // Handle API response
  handleResponse(response: ApiResponse<T>): UseApiResponseState<T> {
    if (isSuccessResponse(response)) {
      return {
        ...this.state,
        data: response.data,
        loading: false,
        error: null,
        errors: [],
        success: true,
        message: response.message,
      };
    }

    return {
      ...this.state,
      data: null,
      loading: false,
      error: response.errors.length > 0 ? response.errors[0] : 'An error occurred',
      errors: response.errors,
      success: false,
      message: null,
    };
  }

  // Handle API error (for catch blocks)
  handleError(error: unknown): UseApiResponseState<T> {
    let errorMessage = 'An unexpected error occurred';
    let errors: string[] = [];

    if (error instanceof ApiError) {
      errorMessage = error.message;
      errors = [error.message];
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errors = [error.message];
    } else if (typeof error === 'string') {
      errorMessage = error;
      errors = [error];
    }

    return {
      ...this.state,
      data: null,
      loading: false,
      error: errorMessage,
      errors,
      success: false,
      message: null,
    };
  }

  // Reset state
  reset(): UseApiResponseState<T> {
    return {
      data: null,
      loading: false,
      error: null,
      errors: [],
      success: false,
      message: null,
    };
  }
}

// Utility function to create a standardized API response handler
export const createApiResponseHandler = <T>(
  initialState?: Partial<UseApiResponseState<T>>
): ApiResponseHandler<T> => {
  return new ApiResponseHandler<T>(initialState);
};

// Higher-order function to wrap API calls with standardized error handling
export const withStandardizedResponse = <TParams extends any[], TResult>(
  apiFunction: (...args: TParams) => Promise<TResult>
) => {
  return async (...args: TParams): Promise<ApiResponse<TResult>> => {
    try {
      const result = await apiFunction(...args);
      
      // If the result is already a standardized response, return it
      if (typeof result === 'object' && result !== null && 'status' in result) {
        return result as ApiResponse<TResult>;
      }
      
      // Otherwise, wrap it in a success response
      return createSuccessResponse(result, 'Operation completed successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        return createFailureResponse([error.message]);
      }
      
      if (error instanceof Error) {
        return createFailureResponse([error.message]);
      }
      
      return createFailureResponse(['An unexpected error occurred']);
    }
  };
};

// Utility for processing form submissions with standardized responses
export const handleFormSubmission = async <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  onSuccess?: (data: T, message: string) => void,
  onError?: (errors: string[]) => void,
  onFinally?: () => void
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiCall();
    
    if (isSuccessResponse(response)) {
      onSuccess?.(response.data, response.message);
    } else {
      onError?.(response.errors);
    }
    
    return response;
  } catch (error) {
    const errorResponse = createFailureResponse([
      error instanceof Error ? error.message : 'An unexpected error occurred'
    ]);
    
    onError?.(errorResponse.errors);
    return errorResponse;
  } finally {
    onFinally?.();
  }
};

// Utility for handling multiple API calls with standardized responses
export const handleMultipleApiCalls = async <T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<ApiResponse<T[K]>> }
): Promise<ApiResponse<T>> => {
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
      return createFailureResponse(errors);
    }
    
    return createSuccessResponse(data, 'All operations completed successfully');
  } catch (error) {
    return createFailureResponse([
      error instanceof Error ? error.message : 'Failed to complete operations'
    ]);
  }
};

// Toast notification integration helpers
export const getToastMessage = <T>(response: ApiResponse<T>): { 
  type: 'success' | 'error'; 
  message: string 
} => {
  if (isSuccessResponse(response)) {
    return {
      type: 'success',
      message: response.message || 'Operation completed successfully'
    };
  }
  
  return {
    type: 'error',
    message: response.errors.length > 0 
      ? response.errors.join(', ')
      : 'An error occurred'
  };
};

// Validation helpers for API responses
export const validateApiResponse = <T>(
  response: any,
  validator?: (data: T) => boolean
): response is ApiResponse<T> => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  if (!['success', 'failure'].includes(response.status)) {
    return false;
  }
  
  if (response.status === 'success') {
    return (
      'data' in response &&
      'message' in response &&
      typeof response.message === 'string' &&
      (!validator || validator(response.data))
    );
  }
  
  if (response.status === 'failure') {
    return (
      'data' in response &&
      'errors' in response &&
      Array.isArray(response.errors) &&
      response.errors.every((error: any) => typeof error === 'string')
    );
  }
  
  return false;
};

// Export commonly used types for convenience
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiFailureResponse,
};

export {
  isSuccessResponse,
  isFailureResponse,
  createSuccessResponse,
  createFailureResponse,
};