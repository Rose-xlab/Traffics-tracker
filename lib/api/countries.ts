import { createClient } from '@/lib/supabase/client';

export async function getCountries() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getCountry(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}