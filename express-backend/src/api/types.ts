// src/types.ts

/**
 * HTS Chapter information
 */
export interface HTSChapter {
  chapter: string;
  description: string;
  sections: HTSSection[];
}

/**
 * HTS Section information
 */
export interface HTSSection {
  code: string;
  description: string;
  rates: HTSRate[];
}

/**
 * HTS Rate information
 */
export interface HTSRate {
  hts_code: string;
  description: string;
  rate: number;
  unit: string;
  special_rates?: {
    program: string;
    rate: number;
  }[];
}

/**
 * Section 301 Tariff information
 */
export interface Section301Tariff {
  hts_code: string;
  rate: number;
  description: string;
  effective_date: string;
  expiry_date?: string;
  list_number: string;
  countries: string[];
}

/**
 * Exclusion information
 */
export interface Exclusion {
  id: string;
  hts_code: string;
  description: string;
  effective_date: string;
  expiry_date?: string;
}

/**
 * Trade Agreement information
 */
export interface TradeAgreement {
  code: string;
  name: string;
  description: string;
  effective_date: string;
  countries: string[];
}

/**
 * CBP Ruling information
 */
export interface CBPRuling {
  ruling_number: string;
  date: string;
  title: string;
  description: string;
  hts_codes: string[];
  url: string;
}

/**
 * Federal Register Notice information
 */
export interface FederalRegisterNotice {
  document_number: string;
  title: string;
  abstract: string;
  publication_date: string;
  effective_date: string;
  html_url: string;
  hts_codes?: string[];
}

// ----- AI-Enhanced Types -----

/**
 * HTS Product information
 */
export interface HTSProduct {
  id: string;
  htsCode: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  baseRate: number;
  additionalRates?: AdditionalRate[];
  specialRates?: SpecialRate[];
  keywords?: string[];
  commonNames?: string[];
  searchableTerms?: string;
  aiEnhanced?: boolean;
}

/**
 * Country information
 */
export interface CountryInfo {
  id: string;
  code: string;
  name: string;
  tradeAgreements?: string[];
  specialTariffs?: string[];
  description?: string;
  flagUrl?: string;
}

/**
 * Rate information
 */
export interface RateInfo {
  baseRate: number;
  additionalRates: AdditionalRate[];
  totalRate: number;
  effectiveDate?: string;
  endDate?: string;
}

/**
 * Additional duty rate
 */
export interface AdditionalRate {
  type: string;
  rate: number;
  description?: string;
  countries?: string[];
  effectiveDate?: string;
  source?: string;
}

/**
 * Special program rate
 */
export interface SpecialRate {
  program: string;
  rate: number;
  description?: string;
}

/**
 * Historical tariff data
 */
export interface TariffHistory {
  id: string;
  productId: string;
  countryId?: string;
  baseRate: number;
  additionalRates: AdditionalRate[];
  totalRate: number;
  effectiveDate: string;
  endDate?: string;
  source: string;
  notes?: string;
  importId?: string;
}

/**
 * AI search match
 */
export interface AISearchMatch {
  htsCode: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * AI search result
 */
export interface AISearchResult {
  htsMatches: AISearchMatch[];
  enhancedQuery: string;
}

/**
 * Tariff explanation
 */
export interface TariffExplanation {
  plainLanguage: string;
  costImpact: string;
  alternatives?: string;
  technicalDetails?: string;
  historicalTrend?: string;
}

/**
 * Product categorization
 */
export interface ProductCategorization {
  category: string;
  subCategory?: string;
  confidence: 'high' | 'medium' | 'low';
  keywords: string[];
  commonNames: string[];
  searchableTerms: string;
}

/**
 * Brand to HTS mapping
 */
export interface BrandToHtsMapping {
  productType: string;
  htsCodes: {
    code: string;
    description: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
  consumerTerms: string[];
  technicalDescription: string;
}

/**
 * Import history record
 */
export interface ImportHistory {
  id: string;
  filename: string;
  fileSize: number;
  rowCount: number;
  productsProcessed: number;
  newProducts: number;
  updatedProducts: number;
  rateChanges: number;
  descriptionChanges: number;
  importDate: string;
  status: 'processing' | 'completed' | 'failed' | 'rolled_back';
  completedDate?: string;
  errorMessage?: string;
  processedBy?: string;
  changeSummary?: any;
}

/**
 * Import change record
 */
export interface ImportChange {
  id: string;
  importId: string;
  htsCode: string;
  productId?: string;
  changeType: 'new' | 'modified' | 'unchanged' | 'removed';
  oldValue?: any;
  newValue: any;
  createdAt: string;
}

/**
 * AI usage metrics
 */
export interface AIUsageMetrics {
  id: string;
  feature: string;
  tokensUsed: number;
  requestTime: number;
  success: boolean;
  metadata?: any;
  createdAt: string;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query?: string;
  category?: string;
  rateRange?: [number, number];
  country?: string;
  useAI?: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  types: {
    rate_changes: boolean;
    new_rulings: boolean;
    exclusions: boolean;
  };
}

/**
 * Change tracker for imports
 */
export interface ChangeTracker {
  productsProcessed: number;
  newProducts: number;
  updatedProducts: number;
  rateChanges: number;
  descriptionChanges: number;
  totalDutyImpact: number;
  details: {
    newProducts: Array<{htsCode: string, name: string}>;
    rateChanges: Array<{htsCode: string, productId: string, oldRate: number, newRate: number}>;
    significantChanges: Array<{htsCode: string, description: string, impact: string}>;
  };
}

/**
 * Notification data
 */
export interface NotificationData {
  title: string;
  message: string;
  type: 'rate_change' | 'new_ruling' | 'exclusion' | 'system';
  productId?: string;
  countryId?: string;
}

/**
 * Watchlist item
 */
export interface WatchlistItem {
  id: string;
  userId: string;
  productId: string;
  countryId?: string;
  notifyChanges: boolean;
  product: HTSProduct;
  country?: CountryInfo;
}