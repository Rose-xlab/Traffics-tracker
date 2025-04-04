"use client";

import { ApiClient, ApiError } from '@/lib/utils/api-client';
import { ErrorHandler } from '@/lib/utils/error-handler';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { analyticsService } from '@/lib/services/analytics-service';
import type { Product } from '@/types';
import type { SearchParams, ProductSearchResponse } from '@/types/api';

export class ProductService {
  /**
   * Search for products with standardized error handling
   */
  async searchProducts(params: SearchParams): Promise<ProductSearchResponse> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('q', params.query);
      if (params.category) queryParams.set('category', params.category);
      if (params.country) queryParams.set('country', params.country);
      if (params.rateRange) {
        queryParams.set('minRate', params.rateRange.min.toString());
        queryParams.set('maxRate', params.rateRange.max.toString());
      }
      
      // Make API request with standardized error handling
      const endpoint = `${API_ENDPOINTS.PRODUCTS}/search?${queryParams.toString()}`;
      const results = await ApiClient.get<ProductSearchResponse>(endpoint);
      
      // Track successful search
      if (params.query) {
        await analyticsService.trackEvent('search', { 
          searchQuery: params.query, 
          resultCount: results.products.length 
        });
      }
      
      return results;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof ApiError && error.status === 429) {
        ErrorHandler.handle(error, {
          context: 'ProductService.searchProducts',
          showToast: true,
          metadata: { params }
        });
        
        // Return empty results for rate limiting to avoid breaking the UI
        return {
          products: [],
          total: 0,
          page: 1,
          totalPages: 0
        };
      }
      
      // For other errors, log but allow them to propagate
      ErrorHandler.handle(error, { 
        context: 'ProductService.searchProducts',
        metadata: { params }
      });
      
      throw error;
    }
  }

  /**
   * Get a single product by ID with standardized error handling
   */
  async getProduct(id: string): Promise<Product> {
    try {
      const product = await ApiClient.get<Product>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
      
      // Track product view
      analyticsService.trackEvent('view_product', {
        productId: id,
        name: product.name
      });
      
      return product;
    } catch (error) {
      // Handle specific error types
      if (error instanceof ApiError && error.status === 404) {
        ErrorHandler.handle(error, {
          context: 'ProductService.getProduct',
          showToast: true,
          metadata: { productId: id }
        });
      } else {
        ErrorHandler.handle(error, {
          context: 'ProductService.getProduct',
          metadata: { productId: id }
        });
      }
      
      throw error;
    }
  }

  /**
   * Get related products by category and similarity
   */
  async getRelatedProducts(productId: string, category: string): Promise<Product[]> {
    try {
      const endpoint = `${API_ENDPOINTS.PRODUCTS}/related?productId=${productId}&category=${encodeURIComponent(category)}`;
      return await ApiClient.get<Product[]>(endpoint);
    } catch (error) {
      // For related products, we can silently handle errors
      // as this is not critical functionality
      ErrorHandler.handle(error, {
        context: 'ProductService.getRelatedProducts',
        metadata: { productId, category }
      });
      
      // Return empty array to avoid breaking the UI
      return [];
    }
  }
}

// Create singleton instance for reuse
export const productService = new ProductService();