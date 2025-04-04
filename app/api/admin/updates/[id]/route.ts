import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth-utils';

/**
 * GET /api/admin/updates/:id - Get a specific trade update
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Trade update not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trade update:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade update' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/updates/:id - Update a trade update
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    if (!body.title || !body.description || !body.impact || !body.publishedDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, impact, and publishedDate are required' },
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
      .update({
        title: body.title,
        description: body.description,
        impact: body.impact,
        source_url: body.sourceUrl,
        source_reference: body.sourceReference || '',
        published_date: body.publishedDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Trade update not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating trade update:', error);
    return NextResponse.json(
      { error: 'Failed to update trade update' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/updates/:id - Delete a trade update
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    // First check if update exists
    const { data: existingUpdate, error: fetchError } = await supabase
      .from('trade_updates')
      .select('id')
      .eq('id', params.id)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Trade update not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }
    
    // Perform the deletion
    const { error: deleteError } = await supabase
      .from('trade_updates')
      .delete()
      .eq('id', params.id);
      
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade update:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade update' },
      { status: 500 }
    );
  }
}