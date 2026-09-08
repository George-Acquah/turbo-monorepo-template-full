import { IdentityEvents } from '@workspace/types';

/**
 * Events the identity module PRODUCES — the single source of truth for
 * "the module that owns the Role/UserRole/ApiKey aggregates owns these
 * events." Enforced by the `workspace/event-ownership` ESLint rule
 * (`packages/configs/eslint/rules/event-ownership.rule.ts`): a
 * `publisher.publish(...)`/`publishWithTransaction(...)` call anywhere under
 * `modules/identity/src/**` must reference an event listed here, never
 * another context's `{Context}Events` constant.
 */
type IdentityEventType = (typeof IdentityEvents)[keyof typeof IdentityEvents];
export const identityProduces: IdentityEventType[] = [
  IdentityEvents.ROLE_ASSIGNED,
  IdentityEvents.ROLE_REVOKED,
  IdentityEvents.PERMISSION_GRANTED_TO_ROLE,
  IdentityEvents.PERMISSION_REVOKED_FROM_ROLE,
  IdentityEvents.API_KEY_CREATED,
  IdentityEvents.API_KEY_REVOKED,
];
