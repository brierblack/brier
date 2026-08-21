import type { UserInfo } from '../types';

export async function fetchCurrentUser(): Promise<UserInfo | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}

export function loginWithGithub(): void {
  window.location.href = '/api/auth/github';
}

export function logout(): void {
  window.location.href = '/api/auth/logout';
}
