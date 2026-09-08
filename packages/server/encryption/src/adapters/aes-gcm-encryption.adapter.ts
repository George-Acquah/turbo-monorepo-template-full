import { Inject, Injectable } from '@nestjs/common';
import { ENCRYPTION_RUNTIME_CONFIG_TOKEN, type EncryptionRuntimeConfig } from '@workspace/ports/config';
import type { EncryptionPort } from '@workspace/ports';
import { decryptAesGcm, encryptAesGcm } from './aes-gcm.util';

/**
 * Today's only `EncryptionPort` implementation. The key binding is entirely
 * this adapter's concern — callers only ever see `encrypt`/`decrypt`.
 */
@Injectable()
export class AesGcmEncryptionAdapter implements EncryptionPort {
  constructor(
    @Inject(ENCRYPTION_RUNTIME_CONFIG_TOKEN)
    private readonly config: EncryptionRuntimeConfig,
  ) {}

  encrypt(plaintext: string): string {
    return encryptAesGcm(plaintext, this.config.key);
  }

  decrypt(ciphertext: string): string {
    return decryptAesGcm(ciphertext, this.config.key);
  }
}
