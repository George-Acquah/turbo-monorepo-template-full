/**
 * Redis Key Prefixes - Centralized key pattern definitions
 *
 * Key Pattern: {PREFIX}:{ENTITY}:{ID}:v{version}
 * List Pattern: {PREFIX}:{ENTITY}:LIST:v{version}
 *
 * All Redis keys MUST use these prefixes as the single source of truth.
 */
export const RedisKeyPrefixes = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Authentication & Authorization
  // ─────────────────────────────────────────────────────────────────────────────
  AUTH: {
    /** User session data: session:user:{userId} */
    SESSION: 'session:user',
    /** Role permissions cache: rbac:role:{roleId} */
    ROLE_PERMISSIONS: 'rbac:role',
    /** User roles cache: rbac:user:{userId} */
    USER_ROLES: 'rbac:user',
    /** Token blacklist: auth:blacklist:{tokenId} */
    TOKEN_BLACKLIST: 'auth:blacklist',
    /** Refresh token store: auth:refresh:{userId} */
    TOKEN_REFRESH: 'auth:refresh',
    /** Policy decision cache: rbac:policy:{userId}:{resource}:{action} */
    POLICY_DECISION: 'rbac:policy',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Entity Caches
  // ─────────────────────────────────────────────────────────────────────────────
  ENTITY: {
    /** User profile: user:{id}:v{version} */
    USER: 'user',

    /** Search data: search:{queryHash}:v{version} */
    SEARCH: 'search',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // List Caches (with version keys for invalidation)
  // ─────────────────────────────────────────────────────────────────────────────
  LIST: {
    /** Search results list version key */
    SEARCH_RESULTS_VERSION: 'list:search:results:version',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Rate Limiting
  // ─────────────────────────────────────────────────────────────────────────────
  RATE_LIMIT: {
    /** API rate limit: ratelimit:api:{ip/userId} */
    API: 'ratelimit:api',
    /** Auth rate limit: ratelimit:auth:{ip} */
    AUTH: 'ratelimit:auth',
    /** Email rate limit: ratelimit:email:{email} */
    EMAIL: 'ratelimit:email',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Queue & Job Related
  // ─────────────────────────────────────────────────────────────────────────────
  QUEUE: {
    /** Email queue jobs: queue:email:{jobId} */
    EMAIL: 'queue:email',
    /** Notification queue: queue:notification:{jobId} */
    NOTIFICATION: 'queue:notification',
    /** Payment webhook processing: queue:webhook:{jobId} */
    WEBHOOK: 'queue:webhook',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Pub/Sub Channels
  // ─────────────────────────────────────────────────────────────────────────────
  PUBSUB: {
    /** Cache invalidation channel */
    CACHE_INVALIDATION: 'pubsub:cache:invalidation',
    /** Real-time notifications */
    NOTIFICATIONS: 'pubsub:notifications',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Misc
  // ─────────────────────────────────────────────────────────────────────────────
  MISC: {
    /** Config cache: config:{key} */
    CONFIG: 'config',
    /** Feature flags: feature:{flagName} */
    FEATURE_FLAG: 'feature',
  },
} as const;

/** Type-safe prefix accessor */
export type RedisKeyPrefix =
  | (typeof RedisKeyPrefixes.AUTH)[keyof typeof RedisKeyPrefixes.AUTH]
  | (typeof RedisKeyPrefixes.ENTITY)[keyof typeof RedisKeyPrefixes.ENTITY]
  | (typeof RedisKeyPrefixes.LIST)[keyof typeof RedisKeyPrefixes.LIST]
  | (typeof RedisKeyPrefixes.RATE_LIMIT)[keyof typeof RedisKeyPrefixes.RATE_LIMIT]
  | (typeof RedisKeyPrefixes.QUEUE)[keyof typeof RedisKeyPrefixes.QUEUE]
  | (typeof RedisKeyPrefixes.PUBSUB)[keyof typeof RedisKeyPrefixes.PUBSUB]
  | (typeof RedisKeyPrefixes.MISC)[keyof typeof RedisKeyPrefixes.MISC];

/**
 * Cache TTL configurations (in seconds)
 */
export const CacheTTL = {
  /** Short TTL for frequently changing data (30 seconds) */
  EPHEMERAL: 30,
  /** User profile cache (1-5 minutes) */
  USER: 60,
  /** Product data (5-30 minutes) */
  PRODUCT: 300,
  /** Search data (5 minutes) */
  SEARCH: 300,
  /** RBAC policy decisions (5 minutes) */
  POLICY: 300,
  /** Session data (24 hours) */
  SESSION: 86400,
  /** Config cache (1 hour) */
  CONFIG: 3600,
} as const;

export type CacheTTLValue = (typeof CacheTTL)[keyof typeof CacheTTL];
