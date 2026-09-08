import { AuthEvents } from '@workspace/types';

/**
 * Events the auth module PRODUCES — the single source of truth for "the
 * module that owns the User/Session aggregate owns these events." Enforced
 * by the `workspace/event-ownership` ESLint rule
 * (`packages/configs/eslint/rules/event-ownership.rule.ts`): a
 * `publisher.publish(...)`/`publishWithTransaction(...)` call anywhere under
 * `modules/auth/src/**` must reference an event listed here, never another
 * context's `{Context}Events` constant.
 */
type AuthEventType = (typeof AuthEvents)[keyof typeof AuthEvents];
export const authProduces: AuthEventType[] = [
  AuthEvents.USER_REGISTERED,
  AuthEvents.SESSION_CREATED,
  AuthEvents.SESSION_REVOKED,
  AuthEvents.ACCOUNT_CLAIMED,
  AuthEvents.EMAIL_VERIFIED,
];
