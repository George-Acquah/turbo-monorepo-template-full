import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService, RateLimitProvider } from './rate-limit.service';

@Global()
@Module({
  providers: [Reflector, RateLimitService, RateLimitProvider, RateLimitGuard],
  exports: [RateLimitService, RateLimitProvider, RateLimitGuard],
})
export class RateLimitModule {}
