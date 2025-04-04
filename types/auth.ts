export interface UserSession {
  id: string;
  email: string;
  app_metadata: {
    is_admin: boolean;
  };
  user_metadata: {
    full_name?: string;
    company?: string;
  };
}

export interface AuthError {
  message: string;
  status: number;
}

export interface AuthResponse {
  user: UserSession | null;
  error?: AuthError;
}