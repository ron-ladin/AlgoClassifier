import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LoginCredentials } from '../types/api';
import { login as loginService } from '../api/services';

interface AuthUser {
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const ACCESS_TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredUser = (): AuthUser | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const userId = localStorage.getItem(USER_ID_KEY);

  if (!token || !userId) {
    return null;
  }

  return { userId };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginService(credentials);

    if (!response.access_token || !response.user_id) {
      throw new Error('Invalid authentication response.');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_ID_KEY, response.user_id);
    setUser({ userId: response.user_id });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: handleLogin,
      logout: handleLogout,
    }),
    [handleLogin, handleLogout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};
