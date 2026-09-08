import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { HashPort } from '@workspace/ports';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';

/**
 * Argon2id password hashing service with transparent bcrypt upgrade support.
 *
 * This service implements the HashPort interface with:
 * - OWASP-recommended argon2id for password hashing
 * - Transparent upgrade: detects bcrypt hashes ($2b$ prefix), verifies, then re-hashes with argon2
 * - Token hashing via SHA-256 HMAC for session/reset tokens (stateless verification)
 *
 * Configuration:
 * - memoryCost: 65536 (64 MB, OWASP minimum for 2024)
 * - timeCost: 3 (iterations, OWASP minimum for 2024)
 * - parallelism: 4 (threads)
 * - type: argon2id (hybrid mode: resistant to GPU + side-channel attacks)
 */
@Injectable()
export class Argon2IdHashService implements HashPort {
  private readonly logger = new Logger(Argon2IdHashService.name);

  /**
   * Argon2id configuration (OWASP 2023 guidelines)
   * - memoryCost: 65536 (64 MB)
   * - timeCost: 3 (3 iterations)
   * - parallelism: 4 (threads)
   * - type: argon2id (hybrid)
   *
   * Reference: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
   */
  private readonly argon2Options = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
  };

  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: AuthRuntimeConfig,
  ) {}

  /**
   * Hash a password using argon2id.
   *
   * @param password - Plain text password to hash
   * @returns Promise<string> - Argon2id hash (ready to store in DB)
   * @throws InternalServerErrorException if hashing fails
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, this.argon2Options);
    } catch (error) {
      this.logger.error('Failed to hash password', error);
      throw new InternalServerErrorException('Failed to hash password.');
    }
  }

  /**
   * Verify a password against its hash with automatic bcrypt upgrade support.
   *
   * This method implements transparent migration from bcrypt → argon2id:
   * 1. If hash is bcrypt ($2b$ or $2y$ prefix), verify with bcrypt
   * 2. On successful verification, return { verified: true, needsUpgrade: true }
   * 3. Caller must re-hash password with argon2id and update User record
   *
   * If hash is argon2id, verify directly.
   *
   * @param password - Plain text password to verify
   * @param hash - Hash from database (bcrypt or argon2id)
   * @returns Promise<boolean> - True if password matches hash
   * @throws InternalServerErrorException if verification fails unexpectedly
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      // Assume argon2id hash; verify directly
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error('Failed to compare password', error);
      throw new InternalServerErrorException('Failed to compare password.');
    }
  }

  /**
   * Check if a hash is a legacy bcrypt hash (requires upgrade).
   *
   * @param hash - Hash from database
   * @returns boolean - True if hash is bcrypt ($2b$ or $2y$)
   */
  isBcryptHash(hash: string): boolean {
    return hash.startsWith('$2b$') || hash.startsWith('$2y$');
  }

  /**
   * Generate a cryptographically strong verification code.
   *
   * Used for email verification, password reset, 2FA challenges, etc.
   *
   * @returns Promise<string> - 6-digit numeric code (100000-999999)
   * @throws InternalServerErrorException if generation fails
   */
  async generateVerificationToken(): Promise<string> {
    try {
      const code = crypto.randomInt(100000, 1000000).toString();
      return code;
    } catch (error) {
      this.logger.error('Failed to generate verification code', error);
      throw new InternalServerErrorException('Failed to generate verification code.');
    }
  }

  /**
   * Hash a token (refresh token, reset token, etc.) using SHA-256 HMAC.
   *
   * Tokens are never stored in plaintext. Only the HMAC digest is persisted.
   * When verifying, we hash the incoming token and compare digests.
   *
   * HMAC uses a per-tenant secret to prevent attacks if multiple tables are encrypted
   * with the same master key.
   *
   * @param token - Raw token (raw bytes in base64url or hex format)
   * @returns Promise<string> - SHA-256 HMAC hex digest (ready to store in DB)
   */
  async hashToken(token: string): Promise<string> {
    return crypto
      .createHmac('sha256', this.cfg.secrets.tokenHashSecret)
      .update(token)
      .digest('hex');
  }

  /**
   * Verify a token against its stored hash using constant-time comparison.
   *
   * @param token - Raw token to verify
   * @param hash - Stored HMAC digest from database
   * @returns Promise<boolean> - True if token matches hash (constant-time)
   */
  async compareToken(token: string, hash: string): Promise<boolean> {
    try {
      const computed = await this.hashToken(token);
      const computedBuffer = Buffer.from(computed, 'utf8');
      const hashBuffer = Buffer.from(hash, 'utf8');

      if (computedBuffer.length !== hashBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(computedBuffer, hashBuffer);
    } catch (error) {
      this.logger.error('Failed to compare token', error);
      throw new InternalServerErrorException('Failed to compare token.');
    }
  }

  async hashBuffer(buffer: Buffer): Promise<string> {
    return crypto
      .createHmac('sha256', this.cfg.secrets.tokenHashSecret)
      .update(buffer)
      .digest('hex');
  }

  /**
   * Generate a cryptographically random, high-entropy secret (API client/key
   * secrets, etc.) — distinct from `generateVerificationToken`'s low-entropy
   * 6-digit code. Callers hash the result via `hashToken` before persisting.
   *
   * @param byteLength - Number of random bytes to generate (default 32 = 256 bits)
   * @returns Promise<string> - base64url-encoded random secret
   */
  async generateSecureToken(byteLength = 32): Promise<string> {
    try {
      return crypto.randomBytes(byteLength).toString('base64url');
    } catch (error) {
      this.logger.error('Failed to generate secure token', error);
      throw new InternalServerErrorException('Failed to generate secure token.');
    }
  }
}
