// lib/utils/api-response.ts
import { NextResponse } from 'next/server';
import { ErrorHandler } from './error-handler';

export interface ApiResponseFormat<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

export class ApiResponse {
  /**
   * Create a successful API response
   */
  static success<T>(data: T, metadata?: Record<string, any>): NextResponse {
    const response: ApiResponseFormat<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    return NextResponse.json(response);
  }

  /**
   * Create an error API response
   */
  static error(error: any, status: number = 500, metadata?: Record<string, any>): NextResponse {
    // Parse the error
    const parsedError = ErrorHandler.parseError(error);
    const errorResult = ErrorHandler.handle(parsedError, { 
      context: 'ApiResponse',
      showToast: false
    });

    // Determine appropriate status code if not provided
    let statusCode = status;
    if (status === 500) {
      if (errorResult.code === 'NOT_FOUND') statusCode = 404;
      if (errorResult.code === 'UNAUTHORIZED') statusCode = 401;
      if (errorResult.code === 'FORBIDDEN') statusCode = 403;
      if (errorResult.code === 'VALIDATION_ERROR') statusCode = 400;
      if (errorResult.code === 'RATE_LIMITED') statusCode = 429;
    }

    // Extract error details if available
    let details;
    if (error.details) {
      details = error.details;
    } else if (error.errors) {
      details = error.errors;
    }

    const response: ApiResponseFormat<null> = {
      success: false,
      error: {
        code: errorResult.code,
        message: errorResult.message,
        details: process.env.NODE_ENV !== 'production' ? details : undefined
      },
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Create a standardized 404 Not Found response
   */
  static notFound(message: string = 'Resource not found'): NextResponse {
    return this.error(new Error(message), 404);
  }

  /**
   * Create a standardized 401 Unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(new Error(message), 401);
  }

  /**
   * Create a standardized 403 Forbidden response
   */
  static forbidden(message: string = 'Forbidden'): NextResponse {
    return this.error(new Error(message), 403);
  }

  /**
   * Create a standardized 400 Bad Request response
   */
  static badRequest(message: string = 'Bad request'): NextResponse {
    return this.error(new Error(message), 400);
  }
}