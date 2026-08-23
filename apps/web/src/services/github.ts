export interface RepoInfo {
  full_name: string;
  name: string;
  private: boolean;
}

export async function fetchGithubRepos(): Promise<RepoInfo[]> {
  const res = await fetch('/api/github/repos');
  if (!res.ok) return [];
  return res.json();
}
