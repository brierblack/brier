import type { UserInfo } from '../types';

export const fetchCurrentUser = async (): Promise<UserInfo | null> => {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
};

/** 跳转指定 OAuth 提供方（github/gitee/...）的登录入口。 */
export function loginWith(provider: string): void {
  window.location.href = `/api/auth/${provider}/login`;
}

export function logout(): void {
  window.location.href = '/api/auth/logout';
}
