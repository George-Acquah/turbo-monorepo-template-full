interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserProfileResponse {
  id: number;
  login?: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

interface GitHubEmailResponse {
  email: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: 'public' | 'private' | null;
}

export type { GitHubEmailResponse, GitHubTokenResponse, GitHubUserProfileResponse };
