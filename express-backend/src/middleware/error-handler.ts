// express-backend/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import logger, { createLogger } from '../utils/logger';
import { sendAlert } from '../monitoring/alerting-service';
import { metrics } from '../monitoring/metrics-manager';

const loga = createLogger('error-handler', logger);

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Central error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {

  const {id} = req.body
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let errorMessage = 'Internal Server Error';
  let errorDetails: any = undefined;
  
  // Track error metrics
  metrics.apiRequestsTotal.inc({
    endpoint: getEndpointFromRequest(req),
    method: req.method,
    status_code: statusCode.toString()
  });
  
  // Handle specific error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    errorMessage = err.message;
    errorDetails = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    errorMessage = 'Unauthorized access';
  } else {
    // Log unknown errors with stack trace
    loga.error(`Unhandled error: ${err.message}`, err);
    
    // Send alert for unhandled errors
    sendAlert({
      severity: 'error',
      title: 'Unhandled API Error',
      message: err.message,
      component: 'api-server',
      details: {
        stack: err.stack,
        path: req.path,
        method: req.method
      }
    });
  }
  
  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    errorDetails = errorDetails || {
      stack: err.stack,
      name: err.name
    };
  }
  
  // Send standardized response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId:id,
      path: req.path,
      method: req.method
    }
  });
}

/**
 * Error handler for 404 Not Found
 */
export function notFoundHandler(req: Request, res: Response) {

  const {id} = req.body
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.path}`
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId:id,
      path: req.path,
      method: req.method
    }
  });
}

/**
 * Helper to get normalized endpoint for metrics
 */
function getEndpointFromRequest(req: Request): string {
  // Normalize path parameters to avoid high cardinality in metrics
  const path = req.route?.path || req.path;
  
  return path
    .replace(/\/api\/products\/[^\/]+/, '/api/products/:id')
    .replace(/\/api\/countries\/[^\/]+/, '/api/countries/:id')
    .replace(/\/api\/tariffs\/[^\/]+\/[^\/]+/, '/api/tariffs/:productId/:countryId');
}

/**
 * Helper to create API errors
 */
export function createError(message: string, statusCode: number, code?: string, details?: any) {
  return new ApiError(message, statusCode, code, details);
}