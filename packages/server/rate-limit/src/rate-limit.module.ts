import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService, RateLimitProvider } from './rate-limit.service';

@Global()
@Module({
  providers: [Reflector, RateLimitService, RateLimitProvider],
  exports: [RateLimitService, RateLimitProvider],
})
export class RateLimitModule {}
