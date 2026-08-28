import type { UserInfo } from '../types';

export const fetchCurrentUser = async (): Promise<UserInfo | null> => {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
};

export function loginWith(provider: string): void {
  window.location.href = `/api/auth/${provider}/login`;
}

export function loginWithGithub(): void {
  loginWith('github');
}

export function logout(): void {
  window.location.href = '/api/auth/logout';
}
