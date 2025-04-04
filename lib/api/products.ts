import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types';

export async function getProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      compliance_requirements (*),
      tariff_rates (
        *,
        countries (*)
      )
    `)
    .order('name');

  if (error) throw error;
  return data as unknown as Product[];
}

export async function getProduct(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      compliance_requirements (*),
      tariff_rates (
        *,
        countries (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as Product;
}

export async function searchProducts(query: string, filters?: {
  category?: string;
  country?: string;
}) {
  const supabase = createClient();
  let queryBuilder = supabase
    .from('products')
    .select(`
      *,
      tariff_rates!inner (
        *,
        countries!inner (*)
      )
    `);

  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,hts_code.ilike.%${query}%`
    );
  }

  if (filters?.category) {
    queryBuilder = queryBuilder.eq('category', filters.category);
  }

  if (filters?.country) {
    queryBuilder = queryBuilder.eq('tariff_rates.countries.code', filters.country);
  }

  const { data, error } = await queryBuilder.limit(20);

  if (error) throw error;
  return data as unknown as Product[];
}