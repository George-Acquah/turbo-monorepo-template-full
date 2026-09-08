import { Global, Module } from '@nestjs/common';
import { ENCRYPTION_PORT_TOKEN } from '@workspace/ports';
import { AesGcmEncryptionAdapter } from './adapters/aes-gcm-encryption.adapter';

/**
 * `@Global()` — provides `EncryptionPort` (bound to `ENCRYPTION_PORT_TOKEN`)
 * app-wide the moment this module is imported anywhere (apps/api and
 * apps/worker both need it: webhook ingestion and settlement run in both
 * processes via `modules/billing`'s HTTP and worker halves).
 */
@Global()
@Module({
  providers: [
    AesGcmEncryptionAdapter,
    { provide: ENCRYPTION_PORT_TOKEN, useExisting: AesGcmEncryptionAdapter },
  ],
  exports: [ENCRYPTION_PORT_TOKEN],
})
export class EncryptionModule {}
