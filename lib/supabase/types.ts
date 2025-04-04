export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          hts_code: string
          name: string
          description: string | null
          category: string
          base_rate: number
          additional_rates: Json | null
          total_rate: number
          exclusions: Json | null
          rulings: Json | null
          effective_dates: Json | null
          image_url: string | null
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hts_code: string
          name: string
          description?: string | null
          category: string
          base_rate: number
          additional_rates?: Json | null
          total_rate: number
          exclusions?: Json | null
          rulings?: Json | null
          effective_dates?: Json | null
          image_url?: string | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hts_code?: string
          name?: string
          description?: string | null
          category?: string
          base_rate?: number
          additional_rates?: Json | null
          total_rate?: number
          exclusions?: Json | null
          rulings?: Json | null
          effective_dates?: Json | null
          image_url?: string | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      countries: {
        Row: {
          id: string
          code: string
          name: string
          flag_url: string | null
          trade_agreements: string[] | null
          special_tariffs: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          flag_url?: string | null
          trade_agreements?: string[] | null
          special_tariffs?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          flag_url?: string | null
          trade_agreements?: string[] | null
          special_tariffs?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      tariff_rates: {
        Row: {
          id: string
          product_id: string
          country_id: string
          base_rate: number
          additional_rates: Json | null
          total_rate: number
          effective_date: string
          expiry_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          country_id: string
          base_rate: number
          additional_rates?: Json | null
          total_rate: number
          effective_date: string
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          country_id?: string
          base_rate?: number
          additional_rates?: Json | null
          total_rate?: number
          effective_date?: string
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_updates: {
        Row: {
          id: string
          title: string
          description: string
          impact: string
          source_url: string | null
          source_reference: string
          published_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          impact: string
          source_url?: string | null
          source_reference: string
          published_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          impact?: string
          source_url?: string | null
          source_reference?: string
          published_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      compliance_requirements: {
        Row: {
          id: string
          product_id: string
          requirement: string
          description: string | null
          authority: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          requirement: string
          description?: string | null
          authority?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          requirement?: string
          description?: string | null
          authority?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_watchlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          country_id: string
          notify_changes: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          country_id: string
          notify_changes?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          country_id?: string
          notify_changes?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// API Response Types
export interface HTSChapter {
  chapter: string;
  description: string;
  sections: HTSSection[];
}

export interface HTSSection {
  code: string;
  description: string;
  rates: HTSRate[];
}

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

export interface Section301Tariff {
  hts_code: string;
  rate: number;
  description: string;
  effective_date: string;
  expiry_date?: string;
  list_number: string;
}

export interface TradeAgreement {
  code: string;
  name: string;
  description: string;
  effective_date: string;
  countries: string[];
}

export interface CBPRuling {
  ruling_number: string;
  date: string;
  title: string;
  description: string;
  hts_codes: string[];
  url: string;
}

export interface FederalRegisterNotice {
  document_number: string;
  title: string;
  abstract: string;
  publication_date: string;
  effective_date: string;
  html_url: string;
  hts_codes?: string[];
}

// Service Response Types
export interface ProductData {
  hts_code: string;
  base_rate: number;
  additional_rates: Section301Tariff[];
  total_rate: number;
  exclusions: {
    id: string;
    description: string;
    effective_date: string;
    expiry_date?: string;
  }[];
  rulings: CBPRuling[];
  effective_dates: {
    date: string;
    notice: string;
    type: string;
  }[];
  last_updated: string;
}

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface TradeUpdate {
  title: string;
  description: string;
  impact: ImpactLevel;
  source_url: string | null;
  source_reference: string;
  published_date: string;
}