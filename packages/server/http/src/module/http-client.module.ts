/**
 * HTTP Client Module
 *
 * Provides a resilient HTTP client with:
 * - Configurable timeouts
 * - Automatic retries with exponential backoff
 * - Circuit breaker pattern
 * - Request correlation ID propagation
 *
 * All external HTTP calls should go through HttpClientService.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';
import { HTTP_PORT_TOKEN } from '@repo/ports';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    HttpClientService,
    {
      provide: HTTP_PORT_TOKEN,
      useExisting: HttpClientService,
    },
  ],
  exports: [HTTP_PORT_TOKEN, HttpClientService],
})
export class HttpClientModule {}
