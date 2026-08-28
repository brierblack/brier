export interface RepoInfo {
  full_name: string;
  name: string;
  private: boolean;
}

/**
 * 拉取指定代码托管平台（provider）下当前用户的仓库列表。
 * 后端路由 `/api/{provider}/repos` 已泛化；未注册的 provider 或未绑定令牌时返回空数组。
 */
export const fetchRepos = async (provider: string): Promise<RepoInfo[]> => {
  const res = await fetch(`/api/${provider}/repos`);
  if (!res.ok) return [];
  return res.json();
};
