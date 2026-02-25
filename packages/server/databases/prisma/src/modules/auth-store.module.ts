import { Global, Module } from '@nestjs/common';
import { PRISMA_AUTH_REPO_TOKEN } from '@repo/ports';
import { AuthRepositoryPrismaAdapter } from '../adapters/auth/auth-repository.prisma';

@Global()
@Module({
  providers: [
    AuthRepositoryPrismaAdapter,

    { provide: PRISMA_AUTH_REPO_TOKEN, useExisting: AuthRepositoryPrismaAdapter },
  ],
  exports: [PRISMA_AUTH_REPO_TOKEN],
})
export class PrismaAuthStoreModule {}
