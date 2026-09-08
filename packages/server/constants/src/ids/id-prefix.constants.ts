// ID Prefixes for cuid2 ID generation
// Use with generateId() from @workspace/utils

export const IdPrefixes = {
  // Users domain
  USER: 'usr',

  // Fees domain

  INVOICE: 'inv',
  INVOICE_LINE_ITEM: 'ili',
  FEE_PAYMENT: 'fpy',
  PAYMENT_ALLOCATION: 'pal',
  RECEIPT: 'rct',
  REMINDER: 'rem',

  // Event infra
  OUTBOX_EVENT: 'obe',
  DEAD_LETTER_EVENT: 'dlq',
  IDEMPOTENCY_KEY: 'idk',
  SAGA: 'sag',

  // Notifications domain
  NOTIFICATION_LOG: 'ntfl',
  NOTIFICATION_PREFERENCE: 'npr',
  PUSH_DEVICE: 'pdv',
  NOTIFICATION_TEMPLATE: 'ntt',
  NOTIFICATION_CHANNEL_CONFIG: 'ntc',
  NOTIFICATION_OUTBOX: 'nto',
  NOTIFICATION_CAMPAIGN: 'ntcp',
  NOTIFICATION_RECIPIENT: 'ntr',
  COMMUNICATION_OVERRIDE: 'cpo',

  EMAIL: 'eml',
  SMS: 'sms',

  // Payments domain (gateway)
  PAYMENT: 'pay',
  PAYMENT_ATTEMPT: 'pat',
  REFUND: 'rfd',
  WEBHOOK_EVENT: 'whk',
  SAVED_PAYMENT_METHOD: 'spm',
  PAYMENT_CONFIG: 'pcf',

  // Files domain
  FILE: 'file',
  FILE_UPLOAD: 'ful',

  // Audit domain
  AUDIT_LOG: 'aud',
  API_LOG: 'api',
  JOB_LOG: 'jlg',
  LOGIN_ATTEMPT: 'lat',
  SYSTEM_EVENT: 'sev',

  // Auth (additions)
  TWO_FACTOR_ENROLLMENT: 'tfa',
  PASSWORD_RESET: 'prt',
  EMAIL_VERIFICATION: 'emv', // was 'evt'; freed for LIVE_EVENT (unreleased)
  PENDING_INVITATION: 'pin',
  ACCOUNT_CLAIM_TOKEN: 'act',
  USER_SESSION: 'ses',
  USER_DEVICE: 'dev',
  USER_AUTH_PROVIDER: 'aup',
  USER_PREFERENCE: 'upf',

  //Identity
  PERMISSION: 'pmt',
  ROLE: 'rol',
  USER_ROLE: 'url', // was 'usr' (collided with USER)
  API_CLIENT: 'acl',
  API_KEY: 'aky',

  // Profiles domain
  PROFILE: 'prf',
  CONSENT: 'cns',

  // Catalog domain
  PROGRAMME: 'prg',
  PROGRAMME_MENTOR: 'pgm',
  PRICE_PLAN: 'ppl',
  COHORT: 'coh',
  MASTERCLASS: 'mcl',

  // Enrolments domain
  ENROLMENT: 'enr',

  // Billing domain (orders/invoices — payment prefixes are above)
  ORDER: 'ord',
  ORDER_ITEM: 'oit',

  // Memberships domain
  SUBSCRIPTION: 'sub',
  ACCESS_GRANT: 'acg',
  COMMUNITY_LINK: 'cml',

  // Learning domain
  COURSE: 'crs',
  MODULE: 'mod',
  LESSON: 'lsn',
  LESSON_RESOURCE: 'lrs',
  LESSON_PROGRESS: 'lpr',
  COHORT_SCHEDULE: 'chs',

  // Events domain (live events)
  LIVE_EVENT: 'evt',
  EVENT_REGISTRATION: 'erg',
  EVENT_REPLAY: 'rpl',

  // Communications (Mongo)
  NOTIFICATION: 'ntf',
  IN_APP_NOTIFICATION: 'ian',
  NOTIFICATION_AUDIT: 'nta',
  NOTIFICATION_DELIVERY: 'ntd',

  // Analytics
  REPORT_EXPORT_JOB: 'rxp',
  AGGREGATED_SNAPSHOT: 'agg',
  USAGE_EVENT: 'uev',

  //Schema-less
  CORRELATION: 'corr',

  //Search
  SEARCH_QUERY: 'sqr',
  POPULAR_SEARCH: 'psq',
  SEARCH_SYNONYM: 'ssn',
  SEARCH_DOCUMENT: 'sdoc',

  // Indicators domain (TradingView invite-only access automation)
  INDICATOR_PRODUCT: 'indp',
  TV_LINK: 'tvl',
  INDICATOR_ACCESS_GRANT: 'iag',
  INDICATOR_ACCESS_TASK: 'iat',
  INDICATOR_AUDIT_EVENT: 'iae',
} as const;
// NOTE: the scheduling (reminder engine) and workflow (DAG approval engine)
// prefixes were removed with their Prisma schemas — orvex ERP machinery not used
// by Workspace. Reminders are BullMQ jobs + notifications; orchestration is
// sagas (workspace_outbox); refund approval is a Refund.status transition.

export type IdPrefix = (typeof IdPrefixes)[keyof typeof IdPrefixes];
