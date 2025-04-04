import { createClient } from '@/lib/supabase/client';

export async function getTradeUpdates(limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trade_updates')
    .select('*')
    .order('published_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getProductUpdates(productId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trade_updates')
    .select('*')
    .textSearch('description', productId)
    .order('published_date', { ascending: false });

  if (error) throw error;
  return data;
}