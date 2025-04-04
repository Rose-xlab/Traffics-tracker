"use client";

import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/services/logger';
import { normalizeSearchTerm, extractSearchTerms } from '@/lib/utils/search';
import type { SearchParams, ProductSearchResponse } from '@/types/api';

const logger = createLogger('search-service');

export class SearchService {
  private readonly supabase = createClient();

  async searchProducts(params: SearchParams): Promise<ProductSearchResponse> {
    try {
      let query = this.supabase
        .from('products')
        .select(`
          *,
          tariff_rates!inner (
            *,
            countries!inner (*)
          )
        `, { count: 'exact' });

      if (params.query) {
        const terms = extractSearchTerms(params.query);
        const searchConditions = terms.map(term => 
          `name.ilike.%${term}%,description.ilike.%${term}%,hts_code.ilike.%${term}%`
        ).join(',');
        
        query = query.or(searchConditions);
      }

      if (params.category) {
        query = query.eq('category', params.category);
      }

      if (params.country) {
        query = query.eq('tariff_rates.countries.code', params.country);
      }

      if (params.rateRange) {
        query = query
          .gte('tariff_rates.total_rate', params.rateRange.min)
          .lte('tariff_rates.total_rate', params.rateRange.max);
      }

      const { data, error, count } = await query
        .order('name')
        .range(0, 19);

      if (error) throw error;

      return {
        products: data || [],
        total: count || 0,
        page: 1,
        totalPages: Math.ceil((count || 0) / 20)
      };
    } catch (error) {
      logger.error('Error searching products', error as Error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const normalizedQuery = normalizeSearchTerm(query);
      
      const { data, error } = await this.supabase
        .from('search_suggestions')
        .select('term, frequency')
        .ilike('term', `${normalizedQuery}%`)
        .order('frequency', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(item => item.term);
    } catch (error) {
      logger.error('Error getting search suggestions', error as Error);
      return [];
    }
  }

  async recordSearchTerm(term: string) {
    try {
      const normalizedTerm = normalizeSearchTerm(term);
      
      const { error } = await this.supabase
        .from('search_suggestions')
        .upsert({
          term: normalizedTerm,
          frequency: 1,
          last_searched: new Date().toISOString(),
        }, {
          onConflict: 'term',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error recording search term', error as Error);
    }
  }
}

export const searchService = new SearchService();