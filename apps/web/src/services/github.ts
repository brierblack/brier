export interface RepoInfo {
  full_name: string;
  name: string;
  private: boolean;
}

export const fetchGithubRepos = async (): Promise<RepoInfo[]> => {
  const res = await fetch('/api/github/repos');
  if (!res.ok) return [];
  return res.json();
};
