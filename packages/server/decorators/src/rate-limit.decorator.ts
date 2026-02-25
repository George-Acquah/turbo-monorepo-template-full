import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_POLICY_META, RATE_LIMIT_SKIP_META } from '@repo/constants';
import { RateLimitPolicy } from '@repo/types/interfaces';

// export function RateLimit(limit: number, ttlSeconds: number, prefix?: string) {
//   return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
//     SetMetadata(THROTTLER_LIMIT, limit)(target, key!, descriptor!);
//     SetMetadata(THROTTLER_TTL, ttlSeconds)(target, key!, descriptor!);
//     if (prefix) SetMetadata(THROTTLER_PREFIX, prefix)(target, key!, descriptor!);
//   };
// }
/**
 * Override rate-limit policy for a controller or handler.
 */
export const RateLimit = (policy: Partial<RateLimitPolicy>) =>
  SetMetadata(RATE_LIMIT_POLICY_META, policy);

/**
 * Disable rate limiting for a controller or handler.
 */
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_SKIP_META, true);
