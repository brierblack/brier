import { createContext, useContext } from 'react';
import type { User } from '@/api/generated';

export interface AuthContextValue {
  user: User | null;
  /** 跳转指定 OAuth 提供方（github/gitee/...）的登录入口。 */
  login: (provider: string) => void;
  /** 登出：整页跳转登出接口（后端清 Cookie 后 302 回首页）。 */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
};
