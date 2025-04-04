"use client";

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchService } from '@/lib/services/search-service';
import { analyticsService } from '@/lib/services/analytics-service';
import type { SearchParams, ProductSearchResponse } from '@/types/api';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchParams>({});
  const [results, setResults] = useState<ProductSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (params: SearchParams) => {
    try {
      setLoading(true);
      const searchResults = await searchService.searchProducts(params);
      setResults(searchResults);

      // Track search event
      if (params.query) {
        await Promise.all([
          searchService.recordSearchTerm(params.query),
          analyticsService.trackEvent('search', { searchQuery: params.query }),
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await searchService.getSearchSuggestions(input);
      setSuggestions(results);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    suggestions,
    search,
    getSuggestions,
  };
}