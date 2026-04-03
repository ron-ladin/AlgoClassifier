import type { LoginCredentials } from '../types/api';

export interface AuthUser {
  userId: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const ACCESS_TOKEN_KEY = 'access_token';
export const USER_ID_KEY = 'user_id';
