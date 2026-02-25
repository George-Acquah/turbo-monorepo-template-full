import { Global, Module } from '@nestjs/common';
import { AUTH_REPO_TOKEN } from '@repo/ports';
import { AuthRepositoryMongoAdapter } from '../adapters/auth/auth-repository.mongo';

@Global()
@Module({
  providers: [
    AuthRepositoryMongoAdapter,
    { provide: AUTH_REPO_TOKEN, useExisting: AuthRepositoryMongoAdapter },
  ],
  exports: [AUTH_REPO_TOKEN],
})
export class MongoAuthStoreModule {}
