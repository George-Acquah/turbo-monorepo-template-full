// GENERATED FILE — DO NOT EDIT BY HAND
// Generated from Prisma schema definitions.
// Run: pnpm --filter @workspace/prisma build
//

export const Schemas = {
  AUDIT: 'workspace_audit',
  AUTH: 'workspace_auth',
  FILES: 'workspace_files',
  IDENTITY: 'workspace_identity',
  NOTIFICATIONS: 'workspace_notifications',
  OUTBOX: 'workspace_outbox',
  PROFILES: 'workspace_profiles',
} as const;

export type Schema = (typeof Schemas)[keyof typeof Schemas];

export const Tables = {
  // workspace_audit
  API_LOGS: 'api_logs',
  AUDIT_LOGS: 'audit_logs',
  JOB_LOGS: 'job_logs',
  LOGIN_ATTEMPTS: 'login_attempts',
  SYSTEM_EVENTS: 'system_events',
  // workspace_auth
  ACCOUNT_CLAIM_TOKENS: 'account_claim_tokens',
  EMAIL_VERIFICATION_TOKENS: 'email_verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  PENDING_INVITATIONS: 'pending_invitations',
  TWO_FACTOR_ENROLLMENTS: 'two_factor_enrollments',
  USER_AUTH_PROVIDERS: 'user_auth_providers',
  USER_DEVICES: 'user_devices',
  USER_PREFERENCES: 'user_preferences',
  USER_SESSIONS: 'user_sessions',
  USERS: 'users',
  // workspace_files
  FILE_RECORDS: 'file_records',
  FILE_UPLOADS: 'file_uploads',
  // workspace_identity
  API_CLIENTS: 'api_clients',
  API_KEYS: 'api_keys',
  PERMISSIONS: 'permissions',
  ROLE_PERMISSIONS: 'role_permissions',
  ROLES: 'roles',
  USER_ROLES: 'user_roles',
  // workspace_notifications
  COMMUNICATION_PREFERENCE_OVERRIDES: 'communication_preference_overrides',
  NOTIFICATION_CHANNEL_CONFIGS: 'notification_channel_configs',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  NOTIFICATION_TEMPLATES: 'notification_templates',
  PUSH_DEVICES: 'push_devices',
  // workspace_outbox
  DEAD_LETTER_EVENTS: 'dead_letter_events',
  IDEMPOTENCY_KEYS: 'idempotency_keys',
  OUTBOX_EVENTS: 'outbox_events',
  SAGA_STATES: 'saga_states',
  // workspace_profiles
  CONSENT_RECORDS: 'consent_records',
  MEMBER_PROFILES: 'member_profiles',
} as const;

export type Table = (typeof Tables)[keyof typeof Tables];

export const ModelToTable = {
  AccountClaimToken: {
    schema: 'workspace_auth',
    table: 'account_claim_tokens',
  },
  ApiClient: {
    schema: 'workspace_identity',
    table: 'api_clients',
  },
  ApiKey: {
    schema: 'workspace_identity',
    table: 'api_keys',
  },
  ApiLog: {
    schema: 'workspace_audit',
    table: 'api_logs',
  },
  AuditLog: {
    schema: 'workspace_audit',
    table: 'audit_logs',
  },
  CommunicationPreferenceOverride: {
    schema: 'workspace_notifications',
    table: 'communication_preference_overrides',
  },
  ConsentRecord: {
    schema: 'workspace_profiles',
    table: 'consent_records',
  },
  DeadLetterEvent: {
    schema: 'workspace_outbox',
    table: 'dead_letter_events',
  },
  EmailVerificationToken: {
    schema: 'workspace_auth',
    table: 'email_verification_tokens',
  },
  FileRecord: {
    schema: 'workspace_files',
    table: 'file_records',
  },
  FileUpload: {
    schema: 'workspace_files',
    table: 'file_uploads',
  },
  IdempotencyKey: {
    schema: 'workspace_outbox',
    table: 'idempotency_keys',
  },
  JobLog: {
    schema: 'workspace_audit',
    table: 'job_logs',
  },
  LoginAttempt: {
    schema: 'workspace_audit',
    table: 'login_attempts',
  },
  MemberProfile: {
    schema: 'workspace_profiles',
    table: 'member_profiles',
  },
  NotificationChannelConfig: {
    schema: 'workspace_notifications',
    table: 'notification_channel_configs',
  },
  NotificationPreference: {
    schema: 'workspace_notifications',
    table: 'notification_preferences',
  },
  NotificationTemplate: {
    schema: 'workspace_notifications',
    table: 'notification_templates',
  },
  OutboxEvent: {
    schema: 'workspace_outbox',
    table: 'outbox_events',
  },
  PasswordResetToken: {
    schema: 'workspace_auth',
    table: 'password_reset_tokens',
  },
  PendingInvitation: {
    schema: 'workspace_auth',
    table: 'pending_invitations',
  },
  Permission: {
    schema: 'workspace_identity',
    table: 'permissions',
  },
  PushDevice: {
    schema: 'workspace_notifications',
    table: 'push_devices',
  },
  Role: {
    schema: 'workspace_identity',
    table: 'roles',
  },
  RolePermission: {
    schema: 'workspace_identity',
    table: 'role_permissions',
  },
  SagaState: {
    schema: 'workspace_outbox',
    table: 'saga_states',
  },
  SystemEvent: {
    schema: 'workspace_audit',
    table: 'system_events',
  },
  TwoFactorEnrollment: {
    schema: 'workspace_auth',
    table: 'two_factor_enrollments',
  },
  User: {
    schema: 'workspace_auth',
    table: 'users',
  },
  UserAuthProvider: {
    schema: 'workspace_auth',
    table: 'user_auth_providers',
  },
  UserDevice: {
    schema: 'workspace_auth',
    table: 'user_devices',
  },
  UserPreference: {
    schema: 'workspace_auth',
    table: 'user_preferences',
  },
  UserRole: {
    schema: 'workspace_identity',
    table: 'user_roles',
  },
  UserSession: {
    schema: 'workspace_auth',
    table: 'user_sessions',
  },
} as const;

export type ModelName = keyof typeof ModelToTable;

export const TableToModel = {
  'account_claim_tokens': 'AccountClaimToken',
  'api_clients': 'ApiClient',
  'api_keys': 'ApiKey',
  'api_logs': 'ApiLog',
  'audit_logs': 'AuditLog',
  'communication_preference_overrides': 'CommunicationPreferenceOverride',
  'consent_records': 'ConsentRecord',
  'dead_letter_events': 'DeadLetterEvent',
  'email_verification_tokens': 'EmailVerificationToken',
  'file_records': 'FileRecord',
  'file_uploads': 'FileUpload',
  'idempotency_keys': 'IdempotencyKey',
  'job_logs': 'JobLog',
  'login_attempts': 'LoginAttempt',
  'member_profiles': 'MemberProfile',
  'notification_channel_configs': 'NotificationChannelConfig',
  'notification_preferences': 'NotificationPreference',
  'notification_templates': 'NotificationTemplate',
  'outbox_events': 'OutboxEvent',
  'password_reset_tokens': 'PasswordResetToken',
  'pending_invitations': 'PendingInvitation',
  'permissions': 'Permission',
  'push_devices': 'PushDevice',
  'role_permissions': 'RolePermission',
  'roles': 'Role',
  'saga_states': 'SagaState',
  'system_events': 'SystemEvent',
  'two_factor_enrollments': 'TwoFactorEnrollment',
  'user_auth_providers': 'UserAuthProvider',
  'user_devices': 'UserDevice',
  'user_preferences': 'UserPreference',
  'user_roles': 'UserRole',
  'user_sessions': 'UserSession',
  'users': 'User',
} as const;

export type TableName = keyof typeof TableToModel;