import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserInfo } from './types';
import { fetchCurrentUser, loginWith, logout as apiLogout } from './services/auth';

interface AuthContextValue {
  user: UserInfo | null;
  loading: boolean;
  /** 跳转指定 OAuth 提供方（github/gitee/...）的登录入口。 */
  login: (provider: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const u = await fetchCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((provider: string) => {
    loginWith(provider);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
