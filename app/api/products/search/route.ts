import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const country = searchParams.get('country');

    if (!query && !category && !country) {
      return NextResponse.json({ error: 'No search parameters provided' }, { status: 400 });
    }

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

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (country) {
      queryBuilder = queryBuilder.eq('tariff_rates.countries.code', country);
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}