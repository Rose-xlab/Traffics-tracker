export type EventType = 
  | 'search'
  | 'view_product'
  | 'calculate_duty'
  | 'add_to_watchlist'
  | 'remove_from_watchlist'
  | 'error';

export interface EventData {
  userId?: string;
  productId?: string;
  countryId?: string;
  searchQuery?: string;
  category?: string;
  errorMessage?: string;
  [key: string]: any;
}

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  data: EventData;
  user_id?: string;
  timestamp: string;
  url?: string;
}

export interface SearchTrend {
  term: string;
  frequency: number;
  last_searched: string;
}