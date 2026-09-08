export abstract class HashPort {
  abstract hashPassword(pw: string): Promise<string>;
  abstract comparePassword(pw: string, hash: string): Promise<boolean>;
  abstract hashToken(token: string): Promise<string>;
  abstract hashBuffer(buffer: Buffer): Promise<string>;
  abstract compareToken(token: string, hash: string): Promise<boolean>;
  abstract generateVerificationToken(): Promise<string>;
  /**
   * Generates a cryptographically random, high-entropy secret (API
   * client/key secrets, etc.) — distinct from `generateVerificationToken`,
   * which is a low-entropy 6-digit code for a different purpose (email/SMS
   * challenges a human types in). Callers still hash the result themselves
   * via `hashToken` before persisting it.
   */
  abstract generateSecureToken(byteLength?: number): Promise<string>;
}
export const HASH_PORT_TOKEN = Symbol('HASH_PORT_TOKEN');
