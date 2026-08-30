import { authMe } from '@/api/generated';

export const getUser = async () => {
  try {
    const result = await authMe();
    return result;
  } catch (error) {
    console.error('获取用户信息失败', error);
    return null;
  }
};
