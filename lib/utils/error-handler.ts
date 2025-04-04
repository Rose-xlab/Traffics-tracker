// lib/utils/error-handler.ts
import { analyticsService } from '@/lib/services/analytics-service';
import { toast } from '@/hooks/use-toast';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorOptions {
  severity?: ErrorSeverity;
  context?: string;
  showToast?: boolean;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Handle application errors with logging, analytics, and optional user notifications
   */
  static async handle(
    error: Error, 
    contextOrOptions: string | ErrorOptions = {}
  ) {
    // Parse options
    const options: ErrorOptions = typeof contextOrOptions === 'string' 
      ? { context: contextOrOptions } 
      : contextOrOptions;
    
    const { 
      severity = 'medium',
      context = 'app',
      showToast = false,
      metadata = {}
    } = options;

    // Log the error
    console.error(`[${context}] ${error.message}`, error);

    // Track error in analytics
    await analyticsService.trackEvent('error', {
      message: error.message,
      context,
      stack: error.stack,
      severity,
      ...metadata
    });

    // Show toast notification if requested
    if (showToast) {
      toast({
        title: "An error occurred",
        description: this.getUserFriendlyMessage(error),
        variant: "destructive",
      });
    }

    // Return user-friendly error message and code
    return {
      message: this.getUserFriendlyMessage(error),
      code: this.getErrorCode(error),
    };
  }

  /**
   * Determine a user-friendly error message based on the error type
   */
  private static getUserFriendlyMessage(error: Error): string {
    // Network errors
    if (error.message.includes('NetworkError') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    // Authentication errors
    if (error.message.includes('auth/') || 
        error.message.includes('401') || 
        error.message.includes('unauthorized')) {
      return 'Authentication error. Please sign in again to continue.';
    }
    
    // Not found errors
    if (error.message.includes('not_found') || 
        error.message.includes('404')) {
      return 'The requested resource was not found.';
    }

    // Validation errors
    if (error.message.includes('validation')) {
      return 'Please check your input and try again.';
    }

    // Rate limiting
    if (error.message.includes('rate limit') || 
        error.message.includes('429')) {
      return 'Too many requests. Please try again later.';
    }

    // Server errors
    if (error.message.includes('500') || 
        error.message.includes('server error')) {
      return 'The server encountered an error. Please try again later.';
    }

    // Default message
    return 'An unexpected error occurred. Please try again later.';
  }

  /**
   * Determine error code from error message
   */
  private static getErrorCode(error: Error): string {
    if (error.message.includes('not_found') || error.message.includes('404')) {
      return 'NOT_FOUND';
    }
    
    if (error.message.includes('auth/') || 
        error.message.includes('401') || 
        error.message.includes('unauthorized')) {
      return 'UNAUTHORIZED';
    }
    
    if (error.message.includes('permission') || error.message.includes('403')) {
      return 'FORBIDDEN';
    }
    
    if (error.message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }
    
    if (error.message.includes('timeout')) {
      return 'TIMEOUT';
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'RATE_LIMITED';
    }
    
    if (error.message.includes('network')) {
      return 'NETWORK_ERROR';
    }
    
    return 'INTERNAL_ERROR';
  }

  /**
   * Parse error from various sources into a standard Error object
   */
  static parseError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error?.message && typeof error.message === 'string') {
      return new Error(error.message);
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error('Unknown error occurred');
    }
  }
}