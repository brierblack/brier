import { use, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getLogoutUrl, getProviderLoginUrl, type User } from '@/api/generated';
import { AuthContext } from '.';

/** 登录：整页跳转授权页（浏览器跟随 302 并落 Set-Cookie，fetch 无法替代导航语义）。 */
const login = (provider: string) => {
  window.location.href = getProviderLoginUrl(provider);
};

/** 登出：整页跳转登出接口（后端清 Cookie 后 302 回首页），与登录对称，不经 fetch。 */
const logout = () => {
  window.location.href = getLogoutUrl();
};

export const AuthProvider = ({
  promiseUser,
  children,
}: {
  promiseUser: Promise<User | null>;
  children: ReactNode;
}) => {
  const location = useLocation();
  const user = use(promiseUser);
  const value = useMemo(() => ({ user, login, logout }), [user]);

  if (!value.user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
