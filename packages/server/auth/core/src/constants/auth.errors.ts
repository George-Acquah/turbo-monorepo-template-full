import { OAuthProviderName } from '@workspace/ports';
import { AuthErrorCodes } from '@workspace/constants';
import {
  BadRequestAppException,
  ConflictAppException,
  UnauthorizedAppException,
  NotFoundAppException,
} from '@workspace/utils';

export class OAuthProviderNotRegisteredException extends BadRequestAppException {
  constructor(provider: OAuthProviderName) {
    super(
      AuthErrorCodes.AUTH_OAUTH_PROVIDER_NOT_REGISTERED,
      `OAuth provider is not registered: ${provider}`,
    );
  }
}

export class OAuthStateInvalidException extends UnauthorizedAppException {
  constructor() {
    super(AuthErrorCodes.AUTH_OAUTH_STATE_INVALID, 'Invalid or expired OAuth state');
  }
}

export class OAuthExchangeFailedException extends UnauthorizedAppException {
  constructor(provider: OAuthProviderName) {
    super(
      AuthErrorCodes.AUTH_OAUTH_EXCHANGE_FAILED,
      `OAuth exchange failed for provider: ${provider}`,
    );
  }
}

export class OAuthAccountNotLinkedException extends UnauthorizedAppException {
  constructor(provider: OAuthProviderName, email?: string | null) {
    const suffix = email ? ` (${email})` : '';
    super(
      AuthErrorCodes.AUTH_OAUTH_ACCOUNT_NOT_LINKED,
      `OAuth account is not linked for provider ${provider}${suffix}`,
    );
  }
}

export class InvalidCredentialsException extends UnauthorizedAppException {
  constructor(message = 'Invalid credentials') {
    super(AuthErrorCodes.AUTH_INVALID_CREDENTIALS, message);
  }
}

export class AccountNotActiveException extends UnauthorizedAppException {
  constructor(message = 'Account is not active') {
    super(AuthErrorCodes.AUTH_UNAUTHORIZED, message);
  }
}

export class UserNotFoundOrInactiveException extends UnauthorizedAppException {
  constructor(message = 'User not found or inactive') {
    super(AuthErrorCodes.AUTH_UNAUTHORIZED, message);
  }
}

export class MissingTokenException extends UnauthorizedAppException {
  constructor(message = 'Missing token') {
    super(AuthErrorCodes.AUTH_UNAUTHORIZED, message);
  }
}

export class SessionRevokedOrExpiredException extends UnauthorizedAppException {
  constructor(message = 'Session revoked or expired') {
    super(AuthErrorCodes.AUTH_TOKEN_EXPIRED, message);
  }
}

export class EmailAlreadyExistsException extends ConflictAppException {
  constructor(message = 'An account with this email already exists') {
    super(AuthErrorCodes.AUTH_EMAIL_ALREADY_EXISTS, message);
  }
}

export class ClaimTokenInvalidException extends NotFoundAppException {
  constructor(message = 'Invalid or unknown account claim token') {
    super(AuthErrorCodes.AUTH_CLAIM_TOKEN_INVALID, message);
  }
}

export class ClaimTokenExpiredException extends BadRequestAppException {
  constructor(message = 'This account claim token has expired') {
    super(AuthErrorCodes.AUTH_CLAIM_TOKEN_EXPIRED, message);
  }
}

export class ClaimAlreadyClaimedException extends ConflictAppException {
  constructor(message = 'This account claim token has already been used') {
    super(AuthErrorCodes.AUTH_CLAIM_ALREADY_CLAIMED, message);
  }
}

export class TurnstileVerificationFailedException extends BadRequestAppException {
  constructor(message = 'Security check failed. Please try again.') {
    super(AuthErrorCodes.AUTH_TURNSTILE_VERIFICATION_FAILED, message);
  }
}

export class EmailVerificationTokenInvalidException extends NotFoundAppException {
  constructor(message = 'Invalid or unknown email verification token') {
    super(AuthErrorCodes.AUTH_EMAIL_VERIFICATION_TOKEN_INVALID, message);
  }
}

export class EmailVerificationTokenExpiredException extends BadRequestAppException {
  constructor(message = 'This email verification token has expired') {
    super(AuthErrorCodes.AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRED, message);
  }
}

export class EmailAlreadyVerifiedException extends ConflictAppException {
  constructor(message = 'This email address is already verified') {
    super(AuthErrorCodes.AUTH_EMAIL_ALREADY_VERIFIED, message);
  }
}
