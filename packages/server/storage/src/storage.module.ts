import { Global, Module, type Provider } from '@nestjs/common';
import { STORAGE_RUNTIME_CONFIG_TOKEN, type StorageRuntimeConfig } from '@repo/config';
import { STORAGE_PORT_TOKEN, type StoragePort } from '@repo/ports';
import { LocalStorageAdapter } from './providers/local/local-storage.adapter';
import { S3StorageAdapter } from './providers/s3/s3-storage.adapter';

const storageProvider: Provider<StoragePort> = {
  provide: STORAGE_PORT_TOKEN,
  inject: [STORAGE_RUNTIME_CONFIG_TOKEN],
  useFactory: (config: StorageRuntimeConfig): StoragePort => {
    switch (config.provider) {
      case 'local':
        return new LocalStorageAdapter(config);
      case 's3':
      case 'r2':
      case 'supabase':
        return new S3StorageAdapter(config);
      default: {
        const exhaustiveConfig: never = config.provider;
        throw new Error(`Unsupported storage provider: ${String(exhaustiveConfig)}`);
      }
    }
  },
};

@Global()
@Module({
  providers: [storageProvider],
  exports: [STORAGE_PORT_TOKEN],
})
export class StorageModule {}
