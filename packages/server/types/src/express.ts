import { Request } from 'express';
import { RequestContext } from './contracts';

/**
 * `user` is widened beyond `RequestContext['user']` (`UserContext`-only) to
 * also allow a `PaymentLinkIdentity` — a guest/plt caller that
 * `PaymentLinkOrJwtGuard` attaches directly to the request without going
 * through `ContextPort.setUser()` (which is, and stays, `UserContext`-only).
 * Only `AppRequest` is widened here; `RequestContext`/`ContextPort` are
 * untouched so every other caller of `getUser()` keeps its existing
 * guarantee of a real authenticated user.
 */
export type AppRequest<T = RequestContext['user']> = Omit<
  Request & RequestContext,
  'user'
> & {
  user?: T;
};

export type { Response, NextFunction } from 'express';
