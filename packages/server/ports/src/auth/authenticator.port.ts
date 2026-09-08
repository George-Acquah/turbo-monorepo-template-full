export abstract class AuthenticatorPort {
  /**
   * Generate a TOTP secret for 2FA setup.
   *
   * @param options - Options for TOTP generation (e.g., user email for label)
   * @returns Base32-encoded secret string
   */
  abstract generateSecret(length?: number): string;

  /**
   * Generate a QR code URI for provisioning the authenticator app.
   *
   * @param email - User's email (used as account name in authenticator app)
   * @param secret - Base32-encoded TOTP secret
   * @param issuer - Issuer name (displayed in authenticator app)

   * @returns otpauth URI string for QR code generation
   */
  abstract keyuri(email: string, secret: string, issuer?: string): string;

  /**
   * Verify a TOTP code against a secret.
   *
   * @param token - TOTP code provided by user
   * @param secret - Base32-encoded TOTP secret to verify against
   * @returns True if the code is valid, false otherwise
   */
  abstract verifyToken(token: string, secret: string): Promise<boolean>;
}

export const AUTHENTICATOR_PORT_TOKEN = Symbol('AUTHENTICATOR_PORT_TOKEN');
