export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  COUNTRIES: '/api/countries',
  TARIFFS: '/api/tariffs',
  UPDATES: '/api/updates',
  WATCHLIST: '/api/watchlist',
  NOTIFICATIONS: '/api/notifications',
  ANALYTICS: '/api/analytics',
  SEARCH: '/api/search',
} as const;

export const CACHE_KEYS = {
  PRODUCTS: 'products',
  COUNTRIES: 'countries',
  TARIFFS: 'tariffs',
  UPDATES: 'updates',
  WATCHLIST: 'watchlist',
  NOTIFICATIONS: 'notifications',
} as const;

export const RATE_LIMITS = {
  API_REQUESTS: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100,
  },
  SEARCH: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 30,
  },
} as const;

export const ANALYTICS = {
  EVENT_TYPES: {
    SEARCH: 'search',
    VIEW_PRODUCT: 'view_product',
    CALCULATE_DUTY: 'calculate_duty',
    ADD_TO_WATCHLIST: 'add_to_watchlist',
    REMOVE_FROM_WATCHLIST: 'remove_from_watchlist',
    ERROR: 'error',
  },
  CACHE_TTL: 3600000, // 1 hour
} as const;

export const NOTIFICATION = {
  TYPES: {
    RATE_CHANGE: 'rate_change',
    NEW_RULING: 'new_ruling',
    EXCLUSION: 'exclusion',
    SYSTEM: 'system',
  },
  FREQUENCIES: {
    IMMEDIATE: 'immediate',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
} as const;

export const VALIDATION = {
  HTS_CODE_PATTERN: /^\d{4}\.\d{2}\.\d{4}$/,
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
} as const;

export const UI = {
  DEBOUNCE_MS: 300,
  ANIMATION_MS: 200,
  TOAST_DURATION_MS: 5000,
} as const;