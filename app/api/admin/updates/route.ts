import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth-utils';

/**
 * GET /api/admin/updates - List all trade updates
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
      .from('trade_updates')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trade updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade updates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/updates - Create new trade update
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
    if (!body.title || !body.description || !body.impact || !body.publishedDate || !body.sourceReference) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, impact, publishedDate, and sourceReference are required' },
        { status: 400 }
      );
    }

    // Validate impact value
    if (!['low', 'medium', 'high'].includes(body.impact)) {
      return NextResponse.json(
        { error: 'Impact must be one of: low, medium, high' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('trade_updates')
      .insert({
        title: body.title,
        description: body.description,
        impact: body.impact,
        source_url: body.sourceUrl,
        source_reference: body.sourceReference,
        published_date: body.publishedDate,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating trade update:', error);
    return NextResponse.json(
      { error: 'Failed to create trade update' },
      { status: 500 }
    );
  }
}