import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth-utils';

/**
 * GET /api/admin/countries - List all countries
 */
export async function GET(request: Request) {
  try {
    // Check if user is admin
    const adminStatus = await isAdmin();
    if (!adminStatus.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/countries - Create new country
 */
export async function POST(request: Request) {
  try {
    // Check if user is admin
    const adminStatus = await isAdmin();
    if (!adminStatus.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Country code and name are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('countries')
      .insert({
        code: body.code,
        name: body.name,
        flag_url: body.flagUrl,
        trade_agreements: body.tradeAgreements || [],
        special_tariffs: body.specialTariffs || [],
        description: body.description,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A country with this code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { error: 'Failed to create country' },
      { status: 500 }
    );
  }
}