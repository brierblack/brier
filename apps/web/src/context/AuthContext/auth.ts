import { authMe } from '@/api/generated';

export const getUser = async () => {
  try {
    return await authMe();
  } catch {
    return null;
  }
};
