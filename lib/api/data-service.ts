/**
 * This file contains the client-side API for accessing the data service
 */
import axios from 'axios';
import type { Product, TariffRate, TradeUpdate, Country } from '@/types';

// Environment variables
const DATA_SERVICE_URL = process.env.NEXT_PUBLIC_DATA_SERVICE_URL || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: DATA_SERVICE_URL,
  timeout: 10000,
});

// API functions for accessing the data service

/**
 * Get products with pagination and filtering
 */
export async function getProducts(params: {
  page?: number;
  limit?: number;
  category?: string;
  query?: string;
} = {}): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const response = await apiClient.get('/api/products', {
      params: {
        page: params.page || 0,
        limit: params.limit || 20,
        category: params.category,
        q: params.query,
      },
    });

    const { data, meta } = response.data;
    
    return {
      products: data,
      total: meta.total,
      page: meta.page,
      totalPages: Math.ceil(meta.total / meta.limit),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
  try {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

/**
 * Get latest trade updates
 */
export async function getTradeUpdates(limit: number = 10): Promise<TradeUpdate[]> {
  try {
    const response = await apiClient.get('/api/updates', {
      params: { limit },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching trade updates:', error);
    throw error;
  }
}

/**
 * Get all countries
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const response = await apiClient.get('/api/countries');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

/**
 * Get tariff rates for a specific product and country
 */
export async function getTariffRate(productId: string, countryId: string): Promise<TariffRate> {
  try {
    const response = await apiClient.get(`/api/tariffs/${productId}/${countryId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching tariff rate for product ${productId}, country ${countryId}:`, error);
    throw error;
  }
}