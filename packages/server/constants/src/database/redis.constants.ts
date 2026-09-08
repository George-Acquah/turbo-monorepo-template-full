/**
 * Redis Key Prefixes - Centralized key pattern definitions
 *
 * Key Pattern: {DOMAIN}:{ENTITY}:{ID}:v{version}
 * List Pattern: {DOMAIN}:{ENTITY}:LIST:v{version}
 *
 * All Redis keys MUST use these prefixes as the single source of truth.
 */
export const RedisKeyPrefixes = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Identity & Access (WorkspaceID)
  // ─────────────────────────────────────────────────────────────────────────────
  IDENTITY: {
    /** User session data: identity:session:{userId} */
    SESSION: 'identity:session',
    /** User profile cache: identity:user:{userId} */
    USER: 'identity:user',
    /** Role permissions cache: identity:rbac:role:{roleId} */
    ROLE_PERMISSIONS: 'identity:rbac:role',
    /** User roles cache: identity:rbac:user:{userId} */
    USER_ROLES: 'identity:rbac:user',
    /** Token blacklist: identity:blacklist:{tokenId} */
    TOKEN_BLACKLIST: 'identity:blacklist',
    /** Refresh token store: identity:refresh:{userId} */
    TOKEN_REFRESH: 'identity:refresh',
    /** Policy decision cache: identity:policy:{userId}:{resource}:{action} */
    POLICY_DECISION: 'identity:policy',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Profiles (member self-service context resolution)
  // ─────────────────────────────────────────────────────────────────────────────
  PROFILES: {
    /** userId -> profileId resolution cache: profiles:user-profile:{userId} */
    USER_PROFILE_ID: 'profiles:user-profile',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Catalog (public commercial/scheduling reads — not user-scoped)
  // ─────────────────────────────────────────────────────────────────────────────
  CATALOG: {
    /** Programme cache: catalog:programmes:{slug or list} */
    PROGRAMMES: 'catalog:programmes',
    /** Price plan cache: catalog:price-plans:{programmeId} */
    PRICE_PLANS: 'catalog:price-plans',
    /** Cohort cache: catalog:cohorts:{id or programmeId} */
    COHORTS: 'catalog:cohorts',
    /** Masterclass cache: catalog:masterclasses:{slug or programmeId} */
    MASTERCLASSES: 'catalog:masterclasses',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Finance (Fees & Payments)
  // ─────────────────────────────────────────────────────────────────────────────
  FINANCE: {
    /** Fee balance cache: finance:fee:balance:{studentId} */
    FEE_BALANCE: 'finance:fee:balance',
    /** Invoice summary cache: finance:invoice:summary:{invoiceId} */
    INVOICE_SUMMARY: 'finance:invoice:summary',
    /** Payment intent/session cache: finance:payment:intent:{reference} */
    PAYMENT_INTENT: 'finance:payment:intent',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Communications & Scheduling
  // ─────────────────────────────────────────────────────────────────────────────
  COMMUNICATIONS: {
    /** Active notification delivery state: comms:delivery:{notificationId} */
    DELIVERY_STATE: 'comms:delivery',
    /** Cached templates: comms:template:{templateId} */
    TEMPLATE: 'comms:template',
    /** In-app notifications */
    IN_APP: 'comms:in-app',
    /** SMS notifications */
    SMS: 'comms:sms',
    /** Push notifications */
    PUSH: 'comms:push',
    /** Email notifications */
    EMAIL: 'comms:email',
    /** WhatsApp notifications */
    WHATSAPP: 'comms:whatsapp',
    /** Telegram notifications */
    TELEGRAM: 'comms:telegram',
    /** LinkedIn notifications */
    LINKEDIN: 'comms:linkedin',
    /** YouTube notifications */
    YOUTUBE: 'comms:youtube',
    /** WhatsApp Business notifications */
    WHATSAPP_BUSINESS: 'comms:whatsapp-business',
    /** WhatsApp Business API notifications */
    WHATSAPP_BUSINESS_API: 'comms:whatsapp-business-api',
    /** WhatsApp Business Cloud notifications */
    WHATSAPP_BUSINESS_CLOUD: 'comms:whatsapp-business-cloud',
    /** WhatsApp Business Phone notifications */
    WHATSAPP_BUSINESS_PHONE: 'comms:whatsapp-business-phone',
    /** WhatsApp Business API Phone notifications */
    WHATSAPP_BUSINESS_API_PHONE: 'comms:whatsapp-business-api-phone',
    /** WhatsApp Business Cloud Phone notifications */
    WHATSAPP_BUSINESS_CLOUD_PHONE: 'comms:whatsapp-business-cloud-phone',
    /** WhatsApp Business Phone API notifications */
    WHATSAPP_BUSINESS_PHONE_API: 'comms:whatsapp-business-phone-api',
    /** WhatsApp Business Phone Cloud notifications */
    WHATSAPP_BUSINESS_PHONE_CLOUD: 'comms:whatsapp-business-phone-cloud',
    /** WhatsApp Business Phone API Cloud notifications */
    WHATSAPP_BUSINESS_PHONE_API_CLOUD: 'comms:whatsapp-business-phone-api-cloud',
    /** WhatsApp Business Phone Cloud API notifications */
    WHATSAPP_BUSINESS_PHONE_CLOUD_API: 'comms:whatsapp-business-phone-cloud-api',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Cross-Cutting: Search & Lists
  // ─────────────────────────────────────────────────────────────────────────────
  SEARCH: {
    /** Search data: search:{index}:{queryHash}:v{version} */
    RESULTS: 'search:results',
    /** Search list version key for bulk invalidation */
    LIST_VERSION: 'search:list:version',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Distributed Locks & Idempotency
  // ─────────────────────────────────────────────────────────────────────────────
  LOCKS: {
    /** Webhook idempotency key to prevent double-processing */
    WEBHOOK: 'lock:webhook:idempotency',
    /** Domain event idempotency (Outbox consumer) */
    EVENT_PROCESSOR: 'lock:event:processor',
    /** Distributed cron lock */
    CRON: 'lock:cron:execution',
    /** General resource mutation lock */
    MUTATION: 'lock:mutation',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Rate Limiting
  // ─────────────────────────────────────────────────────────────────────────────
  RATE_LIMIT: {
    /** API rate limit: ratelimit:api:{ip/userId} */
    API: 'ratelimit:api',
    /** Auth rate limit (brute force protection): ratelimit:auth:{ip/email} */
    AUTH: 'ratelimit:auth',
    /** Communications dispatch limit: ratelimit:comms:{channel}:{target} */
    COMMS: 'ratelimit:comms',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Pub/Sub Channels
  // ─────────────────────────────────────────────────────────────────────────────
  PUBSUB: {
    /** Cache invalidation channel */
    CACHE_INVALIDATION: 'pubsub:cache:invalidation',
    /** Real-time WebSocket notifications */
    WS_NOTIFICATIONS: 'pubsub:ws:notifications',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // System Config
  // ─────────────────────────────────────────────────────────────────────────────
  SYSTEM: {
    /** Config cache: system:config:{key} */
    CONFIG: 'system:config',
    /** Feature flags: system:feature:{flagName} */
    FEATURE_FLAG: 'system:feature',
  },
} as const;

/** Type-safe prefix accessor */
export type RedisKeyPrefix =
  | (typeof RedisKeyPrefixes.IDENTITY)[keyof typeof RedisKeyPrefixes.IDENTITY]
  | (typeof RedisKeyPrefixes.PROFILES)[keyof typeof RedisKeyPrefixes.PROFILES]
  | (typeof RedisKeyPrefixes.CATALOG)[keyof typeof RedisKeyPrefixes.CATALOG]
  | (typeof RedisKeyPrefixes.FINANCE)[keyof typeof RedisKeyPrefixes.FINANCE]
  | (typeof RedisKeyPrefixes.COMMUNICATIONS)[keyof typeof RedisKeyPrefixes.COMMUNICATIONS]
  | (typeof RedisKeyPrefixes.SEARCH)[keyof typeof RedisKeyPrefixes.SEARCH]
  | (typeof RedisKeyPrefixes.LOCKS)[keyof typeof RedisKeyPrefixes.LOCKS]
  | (typeof RedisKeyPrefixes.RATE_LIMIT)[keyof typeof RedisKeyPrefixes.RATE_LIMIT]
  | (typeof RedisKeyPrefixes.PUBSUB)[keyof typeof RedisKeyPrefixes.PUBSUB]
  | (typeof RedisKeyPrefixes.SYSTEM)[keyof typeof RedisKeyPrefixes.SYSTEM];

/**
 * Cache TTL configurations (in seconds)
 */
export const CacheTTL = {
  /** Short TTL for frequently changing data (30 seconds) */
  EPHEMERAL: 30,
  /** Default Distributed Lock Expiration (1 minute) */
  LOCK: 60,
  /** Communications delivery state tracking (2 minutes) */
  DELIVERY_STATE: 120,
  /** Financial summaries and balances (2 minutes) */
  FINANCE_SUMMARY: 120,
  /** User and Student profile caches (5 minutes) */
  PROFILE: 300,
  /** Search query results (5 minutes) */
  SEARCH: 300,
  /** RBAC policy decisions (5 minutes) */
  POLICY: 300,
  /** Idempotency keys (e.g., Webhooks) (24 hours) */
  IDEMPOTENCY: 86400,
  /** Session data (24 hours) */
  SESSION: 86400,
  /** System configurations and templates (1 hour) */
  SYSTEM_CONFIG: 3600,
} as const;

export type CacheTTLValue = (typeof CacheTTL)[keyof typeof CacheTTL];

export const redisConfigKey = 'REDIS_KEY';
export const REDIS_CLIENT = 'REDIS_CLIENT'; // For Cache/API (Fails fast)
export const REDIS_BULLMQ_CLIENT = 'REDIS_BULLMQ_CLIENT'; // For Queues (Waits forever)
