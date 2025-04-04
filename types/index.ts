export interface Product {
  id: string;
  name: string;
  description: string;
  htsCode: string;
  category: string;
  image?: string;
  baseRate: number;
  additionalRates: AdditionalRate[];
  totalRate: number;
  exclusions: Exclusion[];
  rulings: Ruling[];
  effectiveDates: EffectiveDate[];
  lastUpdated: string;
  complianceRequirements: string[];
  historicalRates: HistoricalRate[];
  relatedProducts: RelatedProduct[];
}

export interface AdditionalRate {
  type: string;
  rate: number;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
}

export interface Exclusion {
  id: string;
  description: string;
  effectiveDate: string;
  expiryDate?: string;
}

export interface Ruling {
  number: string;
  date: string;
  title: string;
  description: string;
  url: string;
}

export interface EffectiveDate {
  date: string;
  notice: string;
  type: string;
}

export interface HistoricalRate {
  date: string;
  rate: number;
  volume: number;
}

export interface RelatedProduct {
  id: string;
  name: string;
  htsCode: string;
  rate: string;
  similarity: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  flagUrl?: string;
  tradeAgreements: string[];
  specialTariffs: string[];
  description?: string;
}

export interface TradeAgreement {
  id: string;
  name: string;
  description: string;
  countries: string[];
  effectiveDate: string;
  documents: Document[];
}

export interface Document {
  id: string;
  title: string;
  type: string;
  url: string;
  publishedDate: string;
}

export interface SearchFilters {
  category?: string;
  country?: string;
  rateRange?: {
    min: number;
    max: number;
  };
}

export interface TariffRate {
  baseRate: number;
  additionalRates: AdditionalRate[];
  totalRate: number;
  effectiveDate: string;
  notes?: string;
}

export interface ComplianceRequirement {
  id: string;
  requirement: string;
  description?: string;
  authority?: string;
}

export interface TradeUpdate {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  sourceUrl?: string;
  publishedDate: string;
}