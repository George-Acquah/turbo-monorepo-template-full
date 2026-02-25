import { Injectable, Inject } from '@nestjs/common';
import { OAUTH_PROVIDERS_TOKEN, OAuthProviderPort, OAuthProviderName } from '@repo/ports';

@Injectable()
export class OAuthProviderRegistry {
  private readonly map = new Map<OAuthProviderName, OAuthProviderPort>();

  constructor(
    @Inject(OAUTH_PROVIDERS_TOKEN)
    providers: OAuthProviderPort[] = [],
  ) {
    for (const p of providers) {
      this.map.set(p.provider, p);
    }
  }

  get(provider: OAuthProviderName): OAuthProviderPort {
    const p = this.map.get(provider);
    if (!p) {
      throw new Error(`OAuth provider not registered: ${provider}`);
    }
    return p;
  }
}
