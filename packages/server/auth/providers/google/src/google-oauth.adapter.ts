import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import {
  ExternalProfile,
  HTTP_PORT_TOKEN,
  HttpPort,
  OAuthProviderName,
  OAuthProviderPort,
} from '@repo/ports';
import { googleAuthConfig } from './google.config';
import { GoogleOAuthExchangeError } from './errors';
import { GoogleTokenResponse, GoogleUserInfoResponse } from './interfaces';

@Injectable()
export class GoogleOAuthAdapter implements OAuthProviderPort {
  readonly provider: OAuthProviderName = 'GOOGLE';

  constructor(
    @Inject(HTTP_PORT_TOKEN)
    private readonly http: HttpPort,
    @Inject(googleAuthConfig.KEY)
    private readonly cfg: ConfigType<typeof googleAuthConfig>,
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
    url.searchParams.set('response_type', 'code');
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
      const profile = await this.fetchUserInfo(token.accessToken);

      if (!profile.sub) {
        throw new GoogleOAuthExchangeError('Google userinfo response missing subject');
      }

      return {
        provider: this.provider,
        providerId: profile.sub,
        providerUserId: profile.sub,
        email: profile.email,
        emailVerified: profile.email_verified,
        name: profile.name,
        avatarUrl: profile.picture,
      };
    } catch (error) {
      if (error instanceof GoogleOAuthExchangeError) {
        throw error;
      }

      throw new GoogleOAuthExchangeError('Google OAuth exchange failed', error);
    }
  }

  private async exchangeCodeForAccessToken(params: {
    redirectUri: string;
    code: string;
    codeVerifier: string;
  }): Promise<{ accessToken: string }> {
    const body = new URLSearchParams({
      code: params.code,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: params.codeVerifier,
    }).toString();

    const response = await this.http
      .post<GoogleTokenResponse>(this.cfg.tokenUrl, body, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .catch((error) => {
        throw new GoogleOAuthExchangeError('Google access token request failed', error);
      });

    if (!response.access_token) {
      const reason = response.error_description || response.error || 'missing access token';
      throw new GoogleOAuthExchangeError(`Google token response invalid: ${reason}`);
    }

    return { accessToken: response.access_token };
  }

  private async fetchUserInfo(accessToken: string): Promise<GoogleUserInfoResponse> {
    return this.http
      .get<GoogleUserInfoResponse>(this.cfg.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })
      .catch((error) => {
        throw new GoogleOAuthExchangeError('Google userinfo request failed', error);
      });
  }
}
