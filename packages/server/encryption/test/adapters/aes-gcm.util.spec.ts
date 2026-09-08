import { describe, it, expect } from '@jest/globals';
import { randomBytes } from 'node:crypto';
import { decryptAesGcm, encryptAesGcm } from '../../src/adapters/aes-gcm.util';

describe('aes-gcm.util', () => {
  const key = randomBytes(32).toString('hex');
  const otherKey = randomBytes(32).toString('hex');

  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = 'super secret webhook payload {"foo":"bar"}';

    const ciphertext = encryptAesGcm(plaintext, key);
    const decrypted = decryptAesGcm(ciphertext, key);

    expect(decrypted).toBe(plaintext);
    expect(ciphertext).not.toContain(plaintext);
  });

  it('produces a different ciphertext each call (random IV)', () => {
    const plaintext = 'same input';

    const first = encryptAesGcm(plaintext, key);
    const second = encryptAesGcm(plaintext, key);

    expect(first).not.toBe(second);
  });

  it('throws when decrypting with the wrong key', () => {
    const ciphertext = encryptAesGcm('hello', key);

    expect(() => decryptAesGcm(ciphertext, otherKey)).toThrow();
  });

  it('throws when the ciphertext has been tampered with', () => {
    const ciphertext = encryptAesGcm('hello', key);
    const [iv, authTag, cipherHex] = ciphertext.split(':');
    const tamperedHex = cipherHex.slice(0, -2) + (cipherHex.slice(-2) === '00' ? '01' : '00');
    const tampered = [iv, authTag, tamperedHex].join(':');

    expect(() => decryptAesGcm(tampered, key)).toThrow();
  });

  it('throws on malformed ciphertext (missing segments)', () => {
    expect(() => decryptAesGcm('not-a-valid-ciphertext', key)).toThrow();
  });
});
