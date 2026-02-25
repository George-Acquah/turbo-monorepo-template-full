import { Global, Module } from '@nestjs/common';
import { AUTH_REPO_TOKEN } from '@repo/ports';
import { AuthRepositoryPrismaAdapter } from '../adapters/auth/auth-repository.prisma';

@Global()
@Module({
  providers: [
    AuthRepositoryPrismaAdapter,

    { provide: AUTH_REPO_TOKEN, useExisting: AuthRepositoryPrismaAdapter },
  ],
  exports: [AUTH_REPO_TOKEN],
})
export class PrismaAuthStoreModule {}
