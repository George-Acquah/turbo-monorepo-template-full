import * as crypto from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_RUNTIME_CONFIG_TOKEN, type AuthRuntimeConfig } from '@workspace/ports/config';

/**
 * Signs and verifies HMAC-SHA256 payment-link tokens.
 *
 * Token format: `{base64url_payload}.{hex_signature}`
 *
 * The payload is an arbitrary JSON object (serialised → base64url). The
 * signature is HMAC-SHA256 of the base64url string, keyed with the JWT
 * access secret so no extra secret needs to be managed.
 *
 * Both sign() and verify() are synchronous — no I/O involved.
 */
@Injectable()
export class PaymentLinkTokenService {
  constructor(
    @Inject(AUTH_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: AuthRuntimeConfig,
  ) {}

  /**
   * Encodes `payload` as base64url JSON and appends an HMAC-SHA256 hex
   * signature. Returns the full `{payloadB64}.{sig}` token string.
   */
  sign(payload: Record<string, unknown>): string {
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url' as BufferEncoding);
    const sig = crypto
      .createHmac('sha256', this.cfg.jwt.accessSecret)
      .update(payloadB64)
      .digest('hex');
    return `${payloadB64}.${sig}`;
  }

  /**
   * Verifies the HMAC-SHA256 signature of `token` and returns the decoded
   * payload as `T`.
   *
   * Throws `UnauthorizedException` if the token is malformed or the
   * signature does not match. Expiry checks are the caller's responsibility.
   */
  verify<T extends object>(token: string): T {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex < 1) {
      throw new UnauthorizedException('Malformed payment link.');
    }

    const payloadB64 = token.slice(0, dotIndex);
    const providedSig = token.slice(dotIndex + 1);

    const expected = crypto
      .createHmac('sha256', this.cfg.jwt.accessSecret)
      .update(payloadB64)
      .digest('hex');

    // Convert both signatures to byte buffers and compare their lengths before
    // calling timingSafeEqual — it throws a RangeError if lengths differ.
    const providedBuf = Buffer.from(providedSig, 'hex' as BufferEncoding);
    const expectedBuf = Buffer.from(expected, 'hex' as BufferEncoding);

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Invalid payment link.');
    }

    try {
      return JSON.parse(Buffer.from(payloadB64, 'base64url' as BufferEncoding).toString()) as T;
    } catch {
      throw new UnauthorizedException('Malformed payment link.');
    }
  }
}
