import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OAuthProviderName } from '@repo/ports';

export class OAuthProviderNotRegisteredException extends BadRequestException {
  constructor(provider: OAuthProviderName) {
    super(`OAuth provider is not registered: ${provider}`);
  }
}

export class OAuthStateInvalidException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired OAuth state');
  }
}

export class OAuthExchangeFailedException extends UnauthorizedException {
  constructor(provider: OAuthProviderName) {
    super(`OAuth exchange failed for provider: ${provider}`);
  }
}

export class OAuthAccountNotLinkedException extends UnauthorizedException {
  constructor(provider: OAuthProviderName, email?: string | null) {
    const suffix = email ? ` (${email})` : '';
    super(`OAuth account is not linked for provider ${provider}${suffix}`);
  }
}
