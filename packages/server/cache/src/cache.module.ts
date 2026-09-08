import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor, CACHE_INTERCEPTOR_CONFIG_TOKEN } from './cache.interceptor';
import { CACHE_PORT_TOKEN } from '@workspace/ports';

@Global()
@Module({
  providers: [
    CacheService,
    { provide: CACHE_PORT_TOKEN, useExisting: CacheService },
    CacheInterceptor,
    {
      provide: CACHE_INTERCEPTOR_CONFIG_TOKEN,
      useValue: { bypassHeaderName: 'x-cache-bypass' },
    },
  ],
  exports: [CACHE_PORT_TOKEN, CacheService, CacheInterceptor],
})
export class CacheModule {}
