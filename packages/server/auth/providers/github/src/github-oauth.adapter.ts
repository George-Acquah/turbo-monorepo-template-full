import { Inject, Injectable } from '@nestjs/common';
import {
  GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN,
  type GithubOAuthRuntimeConfig,
} from '@repo/config';
import {
  ExternalProfile,
  HTTP_PORT_TOKEN,
  HttpPort,
  OAuthProviderName,
  OAuthProviderPort,
} from '@repo/ports';
import { GitHubEmailResponse, GitHubTokenResponse, GitHubUserProfileResponse } from './interfaces';
import { GitHubOAuthExchangeError } from './errors';

@Injectable()
export class GitHubOAuthAdapter implements OAuthProviderPort {
  readonly provider: OAuthProviderName = 'GITHUB';

  constructor(
    @Inject(HTTP_PORT_TOKEN)
    private readonly http: HttpPort,
    @Inject(GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: GithubOAuthRuntimeConfig,
  ) {}

  async buildAuthorizeUrl(params: {
    redirectUri: string;
    state: string;
    codeChallenge: string;
    scopes?: string[];
  }): Promise<string> {
    const url = new URL(this.cfg.authorizeUrl);

    const scopes = params.scopes?.length ? params.scopes : this.cfg.scopes;

    url.searchParams.set('client_id', this.cfg.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', params.state);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
  }

  async exchangeCode(params: {
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<ExternalProfile> {
    try {
      const token = await this.exchangeCodeForAccessToken(params);
      const profile = await this.fetchProfile(token.accessToken);

      let emails: GitHubEmailResponse[] = [];
      try {
        emails = await this.fetchEmails(token.accessToken);
      } catch (error) {
        if (!profile.email) {
          throw new GitHubOAuthExchangeError('Unable to fetch GitHub user emails', error);
        }
      }

      const resolvedEmail = this.resolveEmail(profile, emails);

      const providerUserId = String(profile.id);

      return {
        provider: this.provider,
        providerId: providerUserId,
        providerUserId,
        email: resolvedEmail?.email,
        emailVerified: resolvedEmail?.verified,
        name: profile.name || profile.login || undefined,
        avatarUrl: profile.avatar_url || undefined,
      };
    } catch (error) {
      if (error instanceof GitHubOAuthExchangeError) {
        throw error;
      }

      throw new GitHubOAuthExchangeError('GitHub OAuth exchange failed', error);
    }
  }

  private async exchangeCodeForAccessToken(params: {
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<{ accessToken: string }> {
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    }).toString();

    const response = await this.http
      .post<GitHubTokenResponse>(this.cfg.tokenUrl, body, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'repo-auth-github-provider',
        },
      })
      .catch((error) => {
        throw new GitHubOAuthExchangeError('GitHub access token request failed', error);
      });

    if (!response.access_token) {
      const reason = response.error_description || response.error || 'missing access token';
      throw new GitHubOAuthExchangeError(`GitHub token response invalid: ${reason}`);
    }

    return { accessToken: response.access_token };
  }

  private async fetchProfile(accessToken: string): Promise<GitHubUserProfileResponse> {
    const profile = await this.http
      .get<GitHubUserProfileResponse>(this.cfg.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'repo-auth-github-provider',
        },
      })
      .catch((error) => {
        throw new GitHubOAuthExchangeError('GitHub profile request failed', error);
      });

    if (!profile?.id) {
      throw new GitHubOAuthExchangeError('GitHub profile response missing id');
    }

    return profile;
  }

  private async fetchEmails(accessToken: string): Promise<GitHubEmailResponse[]> {
    const emails = await this.http
      .get<GitHubEmailResponse[]>(this.cfg.emailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'repo-auth-github-provider',
        },
      })
      .catch((error) => {
        throw new GitHubOAuthExchangeError('GitHub email request failed', error);
      });

    return Array.isArray(emails) ? emails : [];
  }

  private resolveEmail(
    profile: GitHubUserProfileResponse,
    emails: GitHubEmailResponse[],
  ): { email?: string; verified?: boolean } {
    if (profile.email) {
      const matched = emails.find(
        (entry) => entry.email.toLowerCase() === profile.email!.toLowerCase(),
      );
      return {
        email: profile.email,
        verified: matched?.verified ?? undefined,
      };
    }

    const primaryVerified = emails.find((entry) => entry.primary && entry.verified);
    if (primaryVerified) {
      return { email: primaryVerified.email, verified: primaryVerified.verified };
    }

    const primary = emails.find((entry) => entry.primary);
    if (primary) {
      return { email: primary.email, verified: primary.verified };
    }

    const verified = emails.find((entry) => entry.verified);
    if (verified) {
      return { email: verified.email, verified: verified.verified };
    }

    const first = emails[0];
    if (first) {
      return { email: first.email, verified: first.verified };
    }

    return {};
  }
}
