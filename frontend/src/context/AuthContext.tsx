import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { login as loginService } from '../api/services';
import { AuthContext } from './auth.context';
import { ACCESS_TOKEN_KEY, USER_ID_KEY, type AuthContextValue, type AuthUser } from './auth.types';
import type { LoginCredentials } from '../types/api';

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
