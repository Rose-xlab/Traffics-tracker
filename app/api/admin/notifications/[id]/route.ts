import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth-utils';

/**
 * GET /api/admin/notifications/:id - Get a specific notification
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
      .from('notifications')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/notifications/:id - Update notification read status
 */
export async function PATCH(
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
    if (body.read === undefined) {
      return NextResponse.json(
        { error: 'Read status is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: body.read
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/notifications/:id - Delete a notification
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
    
    // First check if notification exists
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', params.id)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }
    
    // Perform the deletion
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', params.id);
      
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}