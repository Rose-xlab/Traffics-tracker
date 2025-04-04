"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SearchFilters } from "@/components/data/search-filters";
import { AISearchResults } from "@/components/data/ai-search-results";
import { SearchResults } from "@/components/data/search-results";
import { useDebounce } from "@/hooks/use-debounce";
import { productService } from "@/lib/services/product-service";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";
import type { SearchParams } from "@/types/api";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<SearchParams>({});
  const [results, setResults] = useState<Product[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [enhancedQuery, setEnhancedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery || filters.category || filters.rateRange) {
      performSearch();
    }
  }, [debouncedQuery, filters, useAI]);

  const performSearch = async () => {
    try {
      setLoading(true);
      
      if (useAI && debouncedQuery.trim().length > 0) {
        // Call the AI-enhanced search endpoint
        const response = await fetch(`/api/ai-search?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!response.ok) {
          throw new Error('AI search failed');
        }
        
        const data = await response.json();
        setResults(data.products);
        setAiSuggestions(data.aiSuggestions);
        setEnhancedQuery(data.enhancedQuery);
      } else {
        // Call the traditional search endpoint
        const searchResults = await productService.searchProducts({
          query: debouncedQuery,
          ...filters,
        });
        setResults(searchResults.products);
        setAiSuggestions([]);
        setEnhancedQuery("");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "There was a problem with your search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Tariffs</h1>
        <div className="grid md:grid-cols-[1fr,auto] gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={performSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex items-center mt-2 space-x-2">
          <Switch
            id="use-ai"
            checked={useAI}
            onCheckedChange={setUseAI}
          />
          <label
            htmlFor="use-ai"
            className="text-sm flex items-center cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1 text-primary" />
            Use AI-enhanced search
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-[250px,1fr] gap-8">
        {/* Filters */}
        <SearchFilters
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Results */}
        {useAI ? (
          <AISearchResults
            results={results}
            aiSuggestions={aiSuggestions}
            enhancedQuery={enhancedQuery}
            loading={loading}
            onProductSelect={handleProductSelect}
          />
        ) : (
          <SearchResults
            results={results}
            loading={loading}
          />
        )}
      </div>
    </main>
  );
}