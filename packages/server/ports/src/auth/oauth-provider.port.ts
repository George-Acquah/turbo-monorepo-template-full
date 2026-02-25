export type OAuthProviderName = 'GOOGLE' | 'GITHUB';

export interface ExternalProfile {
  provider: OAuthProviderName;
  providerId: string;
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatarUrl?: string;
}

export abstract class OAuthProviderPort {
  abstract provider: OAuthProviderName;
  abstract buildAuthorizeUrl(params: {
    redirectUri: string;
    state: string;
    codeChallenge: string;
    scopes?: string[];
  }): Promise<string>;

  abstract exchangeCode(params: {
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<ExternalProfile>;
}

export const OAUTH_PROVIDERS_TOKEN = Symbol('OAUTH_PROVIDERS_TOKEN'); // multi
