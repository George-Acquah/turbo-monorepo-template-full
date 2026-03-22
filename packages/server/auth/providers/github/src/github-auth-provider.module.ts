import { Module } from '@nestjs/common';
import { OAUTH_PROVIDERS_TOKEN } from '@repo/ports';
import { HttpClientModule } from '@repo/http';
import { GitHubOAuthAdapter } from './github-oauth.adapter';

export const GITHUB_OAUTH_PROVIDER_TOKEN = Symbol('GITHUB_OAUTH_PROVIDER_TOKEN');

@Module({
  imports: [HttpClientModule],
  providers: [
    GitHubOAuthAdapter,
    {
      provide: GITHUB_OAUTH_PROVIDER_TOKEN,
      useExisting: GitHubOAuthAdapter,
    },
    {
      provide: OAUTH_PROVIDERS_TOKEN,
      useFactory: (provider: GitHubOAuthAdapter) => [provider],
      inject: [GITHUB_OAUTH_PROVIDER_TOKEN],
    },
  ],
  exports: [GitHubOAuthAdapter, GITHUB_OAUTH_PROVIDER_TOKEN, OAUTH_PROVIDERS_TOKEN],
})
export class GitHubAuthProviderModule {}
