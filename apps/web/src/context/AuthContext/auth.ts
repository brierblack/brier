import { authMe } from '@/api/generated';

export const getUser = async () => {
  try {
    return authMe();
  } catch {
    return null;
  }
};
