import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const SEGMENT_SEPARATOR = ':';

/**
 * Encrypts `plaintext` with AES-256-GCM under `keyHex` (a 32-byte key,
 * hex-encoded — 64 hex characters). A fresh random IV is generated per call.
 * Returns a single opaque string `${ivHex}:${authTagHex}:${cipherHex}`
 * — the shape every `*Encrypted` persistence field in this codebase expects
 * (plain `string` columns).
 */
export function encryptAesGcm(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(
    SEGMENT_SEPARATOR,
  );
}

/**
 * Decrypts a string produced by `encryptAesGcm`. Throws if the key is wrong
 * or the ciphertext/auth tag has been tampered with (GCM's built-in
 * authentication check).
 */
export function decryptAesGcm(ciphertext: string, keyHex: string): string {
  const [ivHex, authTagHex, cipherHex] = ciphertext.split(SEGMENT_SEPARATOR);
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error('Malformed ciphertext: expected `iv:authTag:cipher` hex segments');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(cipherHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
