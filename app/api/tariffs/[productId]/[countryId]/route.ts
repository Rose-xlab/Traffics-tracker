import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { productId: string; countryId: string } }
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tariff_rates')
      .select('*')
      .eq('product_id', params.productId)
      .eq('country_id', params.countryId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: 'Tariff data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tariff data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tariff data' },
      { status: 500 }
    );
  }
}