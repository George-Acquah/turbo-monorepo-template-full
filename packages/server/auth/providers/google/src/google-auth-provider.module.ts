import { Module } from '@nestjs/common';
import { OAUTH_PROVIDERS_TOKEN } from '@repo/ports';
import { HttpClientModule } from '@repo/http';
import { GoogleOAuthAdapter } from './google-oauth.adapter';

export const GOOGLE_OAUTH_PROVIDER_TOKEN = Symbol('GOOGLE_OAUTH_PROVIDER_TOKEN');

@Module({
  imports: [HttpClientModule],
  providers: [
    GoogleOAuthAdapter,
    {
      provide: GOOGLE_OAUTH_PROVIDER_TOKEN,
      useExisting: GoogleOAuthAdapter,
    },
    {
      provide: OAUTH_PROVIDERS_TOKEN,
      useFactory: (provider: GoogleOAuthAdapter) => [provider],
      inject: [GOOGLE_OAUTH_PROVIDER_TOKEN],
    },
  ],
  exports: [GoogleOAuthAdapter, GOOGLE_OAUTH_PROVIDER_TOKEN, OAUTH_PROVIDERS_TOKEN],
})
export class GoogleAuthProviderModule {}
