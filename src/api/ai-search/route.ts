// src/api/ai-search/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhanceSearch } from '@/services/ai-service';
import { createLogger } from '@/utils/logger';
import { metrics } from '@/monitoring/metrics-manager';

const logger = createLogger('ai-search-api');

export async function GET(request: Request) {
  try {
    // Start timing for metrics
    const startTime = process.hrtime();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }
    
    // Call AI service to enhance the search
    const aiResults = await enhanceSearch(query);
    
    // Extract HTS codes from AI results
    const htsCodes = aiResults.htsMatches.map(match => match.htsCode);
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Query database for products matching the HTS codes
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        tariff_rates (
          *,
          countries (*)
        )
      `);
    
    if (htsCodes.length > 0) {
      // If we have AI-suggested HTS codes, prioritize those
      productsQuery = productsQuery.or(
        `hts_code.in.(${htsCodes.join(',')}),name.ilike.%${aiResults.enhancedQuery}%,description.ilike.%${aiResults.enhancedQuery}%`
      );
    } else {
      // Fall back to traditional search with the original query
      productsQuery = productsQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,hts_code.ilike.%${query}%`
      );
    }
    
    // Execute the query
    const { data: products, error } = await productsQuery.limit(20);
    
    if (error) throw error;
    
    // Calculate request duration for metrics
    const hrDuration = process.hrtime(startTime);
    const durationSeconds = hrDuration[0] + (hrDuration[1] / 1e9);
    
    // Record metrics
    metrics.apiRequestDuration.observe(
      { endpoint: '/api/ai-search', method: 'GET' },
      durationSeconds
    );
    
    // Combine AI results with product data
    const enhancedProducts = products.map(product => {
      // Find the matching AI result if any
      const aiMatch = aiResults.htsMatches.find(
        match => match.htsCode === product.hts_code
      );
      
      return {
        ...product,
        aiMatch: aiMatch ? {
          confidence: aiMatch.confidence,
          reasoning: aiMatch.reasoning
        } : null
      };
    });
    
    // Return the enhanced results
    return NextResponse.json({
      products: enhancedProducts,
      aiSuggestions: aiResults.htsMatches,
      enhancedQuery: aiResults.enhancedQuery,
      metadata: {
        count: enhancedProducts.length,
        aiEnhanced: htsCodes.length > 0,
        processingTime: durationSeconds.toFixed(3)
      }
    });
  } catch (error) {
    logger.error('Error in AI search:', error);
    
    return NextResponse.json(
      { error: 'Failed to perform AI-enhanced search' },
      { status: 500 }
    );
  }
}