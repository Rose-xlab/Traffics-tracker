// lib/utils/auth-utils.ts
import { createClient } from '@/lib/supabase/server';

/**
 * Check if the current user is an admin
 * @returns An object with a boolean isAdmin flag and optional userId
 */
export async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) {
      return { isAdmin: false };
    }

    // Check if user has the admin role in app_metadata
    if (session.user.app_metadata?.is_admin === true) {
      return { isAdmin: true, userId: session.user.id };
    }

    return { isAdmin: false, userId: session.user.id };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false };
  }
}

/**
 * Check if user is authenticated
 * @returns An object with authenticated status and optional userId
 */
export async function isAuthenticated(): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) {
      return { authenticated: false };
    }

    return { authenticated: true, userId: session.user.id };
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return { authenticated: false };
  }
}

/**
 * Get current user ID if authenticated
 * @returns The user ID string or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}