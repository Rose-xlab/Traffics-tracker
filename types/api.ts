import type { Product } from './index';
import type { EventType, EventData } from './analytics';
import type { Notification, NotificationPreferences } from './notifications';
import type { UserSession, AuthError } from './auth';

export interface APIError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
}

export interface SearchParams {
  query?: string;
  category?: string;
  country?: string;
  rateRange?: {
    min: number;
    max: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WatchlistItem {
  id: string;
  product: Product;
  country: {
    code: string;
    name: string;
  };
  notify_changes: boolean;
}

export type {
  EventType,
  EventData,
  Notification,
  NotificationPreferences,
  UserSession,
  AuthError,
};