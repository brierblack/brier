import { Suspense, use, useState, type ReactNode } from 'react';
import { getLogoutUrl, getProviderLoginUrl, type User } from '@/api/generated';
import { AuthContext } from '.';
import { getUser } from './auth';
import { FullScreen } from '@/components/Fallback';

/** 登录：整页跳转授权页（浏览器跟随 302 并落 Set-Cookie，fetch 无法替代导航语义）。 */
const login = (provider: string) => {
  window.location.href = getProviderLoginUrl(provider);
};

/** 登出：整页跳转登出接口（后端清 Cookie 后 302 回首页），与登录对称，不经 fetch。 */
const logout = () => {
  window.location.href = getLogoutUrl();
};

export const AuthProviderUse = ({
  promiseUser,
  children,
}: {
  promiseUser: Promise<User | null>;
  children: ReactNode;
}) => {
  const user = use(promiseUser);

  return (
    <AuthContext.Provider value={{ user: user || null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 走 getUser（内部 catch 401 等错误并返回 null），未登录视为正常状态而非崩溃
  const [promiseUser] = useState(() => getUser());
  return (
    <Suspense fallback={<FullScreen />}>
      <AuthProviderUse promiseUser={promiseUser}>{children}</AuthProviderUse>
    </Suspense>
  );
};
