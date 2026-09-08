import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import {
  API_KEY_REPOSITORY_TOKEN,
  type ApiKeyRepositoryPort,
  API_CLIENT_REPOSITORY_TOKEN,
  type ApiClientRepositoryPort,
  HASH_PORT_TOKEN,
  type HashPort,
  CONTEXT_TOKEN,
  type ContextPort,
} from '@workspace/ports';
import { ApiClientStatus, ApiKeyStatus, IdentityErrorCodes } from '@workspace/constants';
import type { AppRequest } from '@workspace/types';
import { UnauthorizedAppException } from '@workspace/utils';
import { hasExpired } from '@workspace/utils/date';

const AUTH_SCHEME = 'Api-Key';

function extractRawKey(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader?.startsWith(`${AUTH_SCHEME} `)) return undefined;
  const raw = authorizationHeader.slice(AUTH_SCHEME.length + 1).trim();
  return raw.length > 0 ? raw : undefined;
}

/**
 * Machine access (doc 06 §3): `Authorization: Api-Key <raw>`. A plain
 * `CanActivate`, not a Passport strategy — no session/redirect semantics
 * needed for this, and it avoids a new npm dependency for something this
 * simple. Lives in modules/identity (not @workspace/guards) because it
 * owns the ApiClient/ApiKey data this authenticates against.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(API_KEY_REPOSITORY_TOKEN) private readonly apiKeyRepo: ApiKeyRepositoryPort,
    @Inject(API_CLIENT_REPOSITORY_TOKEN) private readonly apiClientRepo: ApiClientRepositoryPort,
    @Inject(HASH_PORT_TOKEN) private readonly hashPort: HashPort,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext.switchToHttp().getRequest<AppRequest>();
    const rawKey = extractRawKey(request.headers.authorization);

    if (!rawKey) {
      throw new UnauthorizedAppException(IdentityErrorCodes.IDENTITY_API_KEY_NOT_FOUND, 'Missing API key');
    }

    const keyHash = await this.hashPort.hashToken(rawKey);
    const apiKey = await this.apiKeyRepo.findByKeyHash(keyHash);

    if (!apiKey) {
      throw new UnauthorizedAppException(IdentityErrorCodes.IDENTITY_API_KEY_NOT_FOUND, 'Invalid API key');
    }

    if (apiKey.status !== ApiKeyStatus.ACTIVE || (apiKey.expiresAt && hasExpired(apiKey.expiresAt))) {
      throw new UnauthorizedAppException(
        IdentityErrorCodes.IDENTITY_API_KEY_REVOKED_OR_EXPIRED,
        'API key is revoked or expired',
      );
    }

    const apiClient = await this.apiClientRepo.findById(apiKey.apiClientId, { select: ['id', 'status'] });
    if (!apiClient || apiClient.status !== ApiClientStatus.ACTIVE) {
      throw new UnauthorizedAppException(
        IdentityErrorCodes.IDENTITY_API_CLIENT_NOT_ACTIVE,
        'API client is not active',
      );
    }

    // No email for a machine actor — same placeholder convention
    // RefreshTokenStrategy already uses for its own no-email principal.
    this.context.setUser({ id: apiClient.id, email: '' });

    // Best-effort usage tracking — never block the request on it.
    void this.apiKeyRepo.updateLastUsed(apiKey.id).catch(() => undefined);

    return true;
  }
}
