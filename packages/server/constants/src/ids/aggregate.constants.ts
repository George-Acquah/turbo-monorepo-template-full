/**
 * AggregateType — the domain aggregates a WorkspaceEvent can be about.
 *
 * This is the type of `WorkspaceEvent.aggregateType` (and the event-publisher
 * port's `aggregateType`). Grounded in the id-prefix roster — real aggregates
 * only, the root entities of each bounded context. Distinct from
 * `AuditEntityType` (entities.constants.ts), which is audit's own, broader
 * entity vocabulary.
 */
export const AggregateType = {
  // auth
  USER: 'USER',
  // identity
  ROLE: 'ROLE',
  USER_ROLE: 'USER_ROLE',
  API_KEY: 'API_KEY',
  // profiles
  PROFILE: 'PROFILE',
  CONSENT_RECORD: 'CONSENT_RECORD',
  // catalog
  PROGRAMME: 'PROGRAMME',
  PRICE_PLAN: 'PRICE_PLAN',
  COHORT: 'COHORT',
  MASTERCLASS: 'MASTERCLASS',
  // enrolments
  ENROLMENT: 'ENROLMENT',
  // billing
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  INVOICE: 'INVOICE',
  WEBHOOK_EVENT: 'WEBHOOK_EVENT',
  SAVED_PAYMENT_METHOD: 'SAVED_PAYMENT_METHOD',
  // memberships
  SUBSCRIPTION: 'SUBSCRIPTION',
  ACCESS_GRANT: 'ACCESS_GRANT',
  COMMUNITY_LINK: 'COMMUNITY_LINK',
  // learning
  COURSE: 'COURSE',
  COURSE_MODULE: 'COURSE_MODULE',
  LESSON: 'LESSON',
  LESSON_PROGRESS: 'LESSON_PROGRESS',
  // live events
  LIVE_EVENT: 'LIVE_EVENT',
  EVENT_REGISTRATION: 'EVENT_REGISTRATION',
  EVENT_REPLAY: 'EVENT_REPLAY',
  // files
  FILE: 'FILE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  // notifications
  NOTIFICATION: 'NOTIFICATION',
  // indicators
  INDICATOR_PRODUCT: 'INDICATOR_PRODUCT',
  TV_LINK: 'TV_LINK',
  INDICATOR_ACCESS_GRANT: 'INDICATOR_ACCESS_GRANT',
  INDICATOR_ACCESS_TASK: 'INDICATOR_ACCESS_TASK',
  INDICATOR_AUDIT_EVENT: 'INDICATOR_AUDIT_EVENT',
} as const;

export type AggregateType = (typeof AggregateType)[keyof typeof AggregateType];
