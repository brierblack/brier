import { listWorkspaces } from '@/api/generated';

export const getSpaces = async () => {
  try {
    const spaces = await listWorkspaces();
    return spaces ?? [];
  } catch {
    return [];
  }
};
