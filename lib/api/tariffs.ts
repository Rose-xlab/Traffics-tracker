import { createClient } from '@/lib/supabase/client';
import type { TariffRate } from '@/types';

export async function getTariffRate(productId: string, countryId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tariff_rates')
    .select('*')
    .eq('product_id', productId)
    .eq('country_id', countryId)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data as unknown as TariffRate;
}

export async function getHistoricalRates(productId: string, countryId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tariff_rates')
    .select('*')
    .eq('product_id', productId)
    .eq('country_id', countryId)
    .order('effective_date');

  if (error) throw error;
  return data as unknown as TariffRate[];
}