// ID Prefixes for cuid2 ID generation
// Use with generateId() from @repo/utils

export const IdPrefixes = {
  // Users domain
  USER: 'usr',
  ADDRESS: 'addr',
  PROFILE: 'prof',

  // Catalog domain
  PRODUCT: 'prod',
  VARIANT: 'var',
  CATEGORY: 'cat',
  OPTION: 'opt',
  MEDIA: 'med',
  PRICE: 'prc',
  TAG: 'tag',
  SIZE_GUIDE: 'szg',

  // Collections domain (Shein-style)
  COLLECTION: 'col',
  FLASH_SALE: 'fls',
  FLASH_SALE_ITEM: 'fsi',

  // Engagement domain (Shein-style)
  WISHLIST: 'wsh',
  WISHLIST_ITEM: 'wsi',
  REVIEW: 'rev',
  REVIEW_IMAGE: 'rvi',
  REVIEW_VOTE: 'rvv',
  QUESTION: 'qst',
  ANSWER: 'ans',
  RECENTLY_VIEWED: 'rcv',

  // Orders domain
  CART: 'crt',
  CART_ITEM: 'crti',
  ORDER: 'ord',
  ORDER_ITEM: 'ordi',
  RESERVATION: 'rsv',
  FULFILLMENT: 'ful',
  COUPON: 'cpn',

  // Payments domain
  PAYMENT: 'pay',
  REFUND: 'rfd',
  PAYOUT: 'pyt',
  WEBHOOK_EVENT: 'whe',

  // Event infra
  OUTBOX_EVENT: 'obe',
  DEAD_LETTER_EVENT: 'dlq',
  IDEMPOTENCY_KEY: 'idk',
  SAGA: 'sag',

  // Notifications domain
  NOTIFICATION: 'ntf',
  NOTIFICATION_LOG: 'ntfl',
  EMAIL: 'eml',
  SMS: 'sms',

  // Files domain
  FILE: 'file',

  // Audit domain
  AUDIT_LOG: 'aud',
  API_LOG: 'api',
  JOB_LOG: 'jlg',
  LOGIN_ATTEMPT: 'lat',
  SYSTEM_EVENT: 'sev',

  // Analytics domain
  ANALYTICS_EVENT: 'aev',
  PAGE_VIEW: 'pgv',
  PRODUCT_EVENT: 'pev',
  DAILY_METRIC: 'dmt',
  PRODUCT_DAILY_METRIC: 'pdm',
  SEARCH_DAILY_METRIC: 'sdm',
} as const;

export type IdPrefix = (typeof IdPrefixes)[keyof typeof IdPrefixes];
