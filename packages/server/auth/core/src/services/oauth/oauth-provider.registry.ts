import { Injectable, Inject, Optional } from '@nestjs/common';
import { OAUTH_PROVIDERS_TOKEN, OAuthProviderPort, OAuthProviderName } from '@repo/ports';
import { OAuthProviderNotRegisteredException } from '../../constants';

@Injectable()
export class OAuthProviderRegistry {
  private readonly map = new Map<OAuthProviderName, OAuthProviderPort>();

  constructor(
    @Optional()
    @Inject(OAUTH_PROVIDERS_TOKEN)
    providers: OAuthProviderPort[] = [],
  ) {
    for (const p of providers) {
      if (this.map.has(p.provider)) {
        throw new Error(`Duplicate OAuth provider registration: ${p.provider}`);
      }
      this.map.set(p.provider, p);
    }
  }

  get(provider: OAuthProviderName): OAuthProviderPort {
    const p = this.map.get(provider);
    if (!p) {
      throw new OAuthProviderNotRegisteredException(provider);
    }
    return p;
  }
}
