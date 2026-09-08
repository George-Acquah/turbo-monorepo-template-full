export const Resource = {
  AUTH: 'AUTH',
  SESSION: 'SESSION',
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  NOTIFICATION: 'NOTIFICATION',
  AUDIT: 'AUDIT',
  // Staff/admin RBAC seed matrix resources (doc 06 §3) — permission keys are
  // `<resource>:<action>` built from this map × Action (actions.constants.ts).
  CATALOG: 'CATALOG',
  LEARNING: 'LEARNING',
  EVENTS: 'EVENTS',
  ENROLMENT: 'ENROLMENT',
  BILLING: 'BILLING',
  ACCESS: 'ACCESS',
  REFUND: 'REFUND',
  OPS: 'OPS',
  INDICATORS: 'INDICATORS',
} as const;

export type Resource = (typeof Resource)[keyof typeof Resource];
