import { createLogger } from '@/lib/services/logger';
import { createClient } from '@/lib/supabase/server';

const logger = createLogger('auth-service');

export class AuthService {
  private readonly supabase = createClient();

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error signing up', error as Error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error signing in', error as Error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      logger.error('Error signing out', error as Error);
      throw error;
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      logger.error('Error getting session', error as Error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error resetting password', error as Error);
      throw error;
    }
  }
}

export const authService = new AuthService();