import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth-utils';

/**
 * GET /api/admin/notifications - List all notifications (admin access)
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
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/notifications - Create new notification (admin access)
 * Can send to a specific user or all users
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
    if (!body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, and type are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Check if sending to all users or a specific user
    if (body.all_users) {
      // Get all users (in a real app, consider pagination for large user base)
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id');
        
      if (usersError) throw usersError;
      
      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'No users found to send notifications to' },
          { status: 404 }
        );
      }
      
      // Create a notification for each user
      const notifications = users.map(user => ({
        user_id: user.id,
        title: body.title,
        message: body.message,
        type: body.type,
        read: false,
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();
        
      if (error) throw error;
      
      return NextResponse.json(data);
    } else {
      // Send to a specific user
      if (!body.user_id) {
        return NextResponse.json(
          { error: 'User ID is required when sending to a specific user' },
          { status: 400 }
        );
      }
      
      // Verify the user exists
      const { data: user, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('id', body.user_id)
        .single();
        
      if (userError) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Create the notification
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: body.user_id,
          title: body.title,
          message: body.message,
          type: body.type,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}