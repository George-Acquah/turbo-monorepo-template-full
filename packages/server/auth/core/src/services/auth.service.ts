import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import {
  AUTH_REPO_TOKEN,
  HASH_PORT_TOKEN,
  OAuthProviderName,
  TOKEN_PORT_TOKEN,
  type AuthRepositoryPort,
  type HashPort,
  type TokenPort,
} from '@repo/ports';
import { DeviceIdService } from './device-id.service';
import * as crypto from 'crypto';
import { AppRequest } from '@repo/types';
import { OAuthProviderRegistry, OAuthStateService, PkceService } from './oauth';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPO_TOKEN)
    private readonly repo: AuthRepositoryPort,

    @Inject(HASH_PORT_TOKEN)
    private readonly hash: HashPort,

    @Inject(TOKEN_PORT_TOKEN)
    private readonly tokens: TokenPort,

    private readonly deviceIdService: DeviceIdService,
    private readonly oauthRegistry: OAuthProviderRegistry,
    private readonly pkce: PkceService,
    private readonly oauthState: OAuthStateService,
  ) {}

  // ------------------------
  // Local Login
  // ------------------------

  async loginWithEmail(req: AppRequest, email: string, password: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.hash.comparePassword(password, user.passwordHash);
    if (!valid) {
      await this.repo.recordLoginFailure({ userId: user.id });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.repo.recordLoginSuccess({ userId: user.id, ipAddress: req.ip });

    return this.issueTokens(req, user.id, user.role);
  }

  // ------------------------
  // Refresh Rotation
  // ------------------------

  async refresh(req: AppRequest, rawRefreshToken: string) {
    const payload = await this.tokens.verifyRefresh(rawRefreshToken);

    const deviceId = this.deviceIdService.resolve(req);

    const session = await this.repo.getRefreshSession({
      userId: payload.sub,
      deviceId,
    });

    if (!session) throw new UnauthorizedException('Session revoked');

    const computedHash = await this.hash.hashToken(rawRefreshToken);
    if (computedHash !== session.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh expired');
    }

    return this.issueTokens(req, payload.sub, payload.roles || []);
  }

  // ------------------------
  // Logout
  // ------------------------

  async logout(req: AppRequest, userId: string) {
    const deviceId = this.deviceIdService.resolve(req);

    await this.repo.revokeRefreshSession({ userId, deviceId });
  }

  // ------------------------
  // Token Issuance
  // ------------------------

  private async issueTokens(req: AppRequest, userId: string, role: string | string[]) {
    const deviceId = this.deviceIdService.resolve(req);

    const jti = crypto.randomUUID();

    const accessToken = await this.tokens.signAccess({
      sub: userId,
      roles: Array.isArray(role) ? role : [role],
    });

    const refreshToken = await this.tokens.signRefresh({
      sub: userId,
      roles: Array.isArray(role) ? role : [role],
      jti,
    });

    const refreshHash = await this.hash.hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.repo.upsertRefreshSession({
      userId,
      deviceId,
      refreshTokenHash: refreshHash,
      jti,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { accessToken, refreshToken };
  }

  async oauthStart(providerName: OAuthProviderName, redirectUri: string, returnTo?: string) {
    const provider = this.oauthRegistry.get(providerName);

    const verifier = this.pkce.generateVerifier();
    const challenge = this.pkce.generateChallenge(verifier);

    const state = await this.oauthState.create({
      provider: providerName,
      codeVerifier: verifier,
      returnTo,
    });

    const url = await provider.buildAuthorizeUrl({
      redirectUri,
      state,
      codeChallenge: challenge,
    });

    return { url };
  }

  async oauthCallback(state: string, code: string, redirectUri: string, req: AppRequest) {
    const stored = await this.oauthState.consume(state);
    if (!stored) throw new UnauthorizedException('Invalid OAuth state');

    const provider = this.oauthRegistry.get(stored.provider as OAuthProviderName);

    const profile = await provider.exchangeCode({
      redirectUri,
      code,
      codeVerifier: stored.codeVerifier,
    });

    let user = await this.repo.findUserByProviderIdentity({
      provider: profile.provider,
      providerId: profile.providerId,
    });

    if (!user) {
      // Optional: create user automatically
      // const created = await this.repo.createUserFromOAuth(profile);
      user = null
    }

    return this.issueTokens(req, user!.id, user!.role);
  }
}
