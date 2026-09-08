import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_POLICY_META, RATE_LIMIT_SKIP_META } from '@workspace/constants';
import { RateLimitPolicy } from '@workspace/types/contracts';

/**
 * Override rate-limit policy for a controller or handler.
 */
export const RateLimit = (policy: Partial<RateLimitPolicy>) =>
  SetMetadata(RATE_LIMIT_POLICY_META, policy);

/**
 * Disable rate limiting for a controller or handler.
 */
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_SKIP_META, true);
