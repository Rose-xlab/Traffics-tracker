// lib/utils/api-client.ts
import { ErrorHandler } from './error-handler';
import { toast } from '@/hooks/use-toast';
import type { ApiResponseFormat } from './api-response';

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  /**
   * Make a GET request with standardized error handling
   */
  static async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a POST request with standardized error handling
   */
  static async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a PUT request with standardized error handling
   */
  static async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a PATCH request with standardized error handling
   */
  static async patch<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a DELETE request with standardized error handling
   */
  static async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Core request method with standardized error handling
   */
  private static async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });

      const contentType = response.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');
      
      // Parse response based on content type
      const responseData = isJson ? await response.json() : await response.text();
      
      // Handle API responses in the standard format
      if (isJson && this.isApiResponse(responseData)) {
        if (!responseData.success) {
          throw new ApiError(
            responseData.error?.message || 'Unknown error',
            response.status,
            responseData.error?.code,
            responseData.error?.details
          );
        }
        
        return responseData.data as T;
      }
      
      // Handle non-standard successful responses
      if (response.ok) {
        return isJson ? responseData : (responseData as unknown as T);
      }
      
      // Handle non-standard error responses
      throw new ApiError(
        isJson && responseData.message ? responseData.message : `API Error: ${response.statusText}`,
        response.status,
        isJson && responseData.code ? responseData.code : 'API_ERROR'
      );
      
    } catch (error) {
      // Handle network errors and other exceptions
      if (!(error instanceof ApiError)) {
        const apiError = new ApiError(
          error instanceof Error ? error.message : 'Network error occurred',
          0,
          'NETWORK_ERROR'
        );
        
        // Log the error
        ErrorHandler.handle(apiError, {
          context: 'ApiClient',
          severity: 'high',
          metadata: { endpoint, method: options.method }
        });
        
        // Show toast notification for network errors
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please check your internet connection.",
          variant: "destructive"
        });
        
        throw apiError;
      }
      
      // Handle API errors
      ErrorHandler.handle(error, {
        context: 'ApiClient',
        severity: error.status >= 500 ? 'high' : 'medium',
        metadata: { endpoint, method: options.method, status: error.status }
      });
      
      // Show toast for server errors
      if (error.status >= 500) {
        toast({
          title: "Server Error",
          description: "The server encountered an error. Please try again later.",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  }

  /**
   * Type guard to check if response matches our API response format
   */
  private static isApiResponse(data: any): data is ApiResponseFormat<any> {
    return data && typeof data === 'object' && 'success' in data;
  }
}

/**
 * Custom API Error class to standardize error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}