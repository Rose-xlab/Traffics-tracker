import { createClient } from '@/lib/supabase/client';

export async function getWatchlist() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_watchlists')
    .select(`
      *,
      products (*),
      countries (*)
    `);

  if (error) throw error;
  return data;
}

export async function addToWatchlist(productId: string, countryId: string, notifyChanges: boolean = true) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_watchlists')
    .insert({
      product_id: productId,
      country_id: countryId,
      notify_changes: notifyChanges,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWatchlist(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_watchlists')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateWatchlistNotifications(id: string, notifyChanges: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_watchlists')
    .update({ notify_changes: notifyChanges })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}