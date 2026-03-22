// GENERATED FILE — DO NOT EDIT BY HAND
// It provides a syntatic sugar for your table names at build and run time  
// Run: pnpm -w -C packages/database run generate:table-names

export const MODEL_TO_TABLE = {
  "AuditLog": {
    "table": "audit_logs",
    "schema": "audit"
  },
  "SystemEvent": {
    "table": "system_events",
    "schema": "audit"
  },
  "ApiLog": {
    "table": "api_logs",
    "schema": "audit"
  },
  "JobLog": {
    "table": "job_logs",
    "schema": "audit"
  },
  "LoginAttempt": {
    "table": "login_attempts",
    "schema": "audit"
  },
  "OutboxEvent": {
    "table": "outbox_events",
    "schema": "events"
  },
  "DeadLetterEvent": {
    "table": "dead_letter_events",
    "schema": "events"
  },
  "SagaState": {
    "table": "saga_states",
    "schema": "events"
  },
  "IdempotencyKey": {
    "table": "idempotency_keys",
    "schema": "events"
  },
  "File": {
    "table": "files",
    "schema": "files"
  },
  "FileUpload": {
    "table": "file_uploads",
    "schema": "files"
  },
  "ProductImage": {
    "table": "product_images",
    "schema": "files"
  },
  "Payment": {
    "table": "payments",
    "schema": "payments"
  },
  "PaymentAttempt": {
    "table": "payment_attempts",
    "schema": "payments"
  },
  "Refund": {
    "table": "refunds",
    "schema": "payments"
  },
  "WebhookEvent": {
    "table": "webhook_events",
    "schema": "payments"
  },
  "SavedPaymentMethod": {
    "table": "saved_payment_methods",
    "schema": "payments"
  },
  "PaymentConfig": {
    "table": "payment_configs",
    "schema": "payments"
  },
  "User": {
    "table": "users",
    "schema": "users"
  },
  "Address": {
    "table": "addresses",
    "schema": "users"
  },
  "UserAuthProvider": {
    "table": "user_auth_providers",
    "schema": "users"
  },
  "UserPreference": {
    "table": "user_preferences",
    "schema": "users"
  },
  "UserSession": {
    "table": "user_sessions",
    "schema": "users"
  },
  "PasswordResetToken": {
    "table": "password_reset_tokens",
    "schema": "users"
  },
  "EmailVerificationToken": {
    "table": "email_verification_tokens",
    "schema": "users"
  }
} as const;
export const TABLE_TO_MODEL = {
  "audit_logs": "AuditLog",
  "system_events": "SystemEvent",
  "api_logs": "ApiLog",
  "job_logs": "JobLog",
  "login_attempts": "LoginAttempt",
  "outbox_events": "OutboxEvent",
  "dead_letter_events": "DeadLetterEvent",
  "saga_states": "SagaState",
  "idempotency_keys": "IdempotencyKey",
  "files": "File",
  "file_uploads": "FileUpload",
  "product_images": "ProductImage",
  "payments": "Payment",
  "payment_attempts": "PaymentAttempt",
  "refunds": "Refund",
  "webhook_events": "WebhookEvent",
  "saved_payment_methods": "SavedPaymentMethod",
  "payment_configs": "PaymentConfig",
  "users": "User",
  "addresses": "Address",
  "user_auth_providers": "UserAuthProvider",
  "user_preferences": "UserPreference",
  "user_sessions": "UserSession",
  "password_reset_tokens": "PasswordResetToken",
  "email_verification_tokens": "EmailVerificationToken"
} as const;

export type PrismaModelName = 'Address' | 'ApiLog' | 'AuditLog' | 'DeadLetterEvent' | 'EmailVerificationToken' | 'File' | 'FileUpload' | 'IdempotencyKey' | 'JobLog' | 'LoginAttempt' | 'OutboxEvent' | 'PasswordResetToken' | 'Payment' | 'PaymentAttempt' | 'PaymentConfig' | 'ProductImage' | 'Refund' | 'SagaState' | 'SavedPaymentMethod' | 'SystemEvent' | 'User' | 'UserAuthProvider' | 'UserPreference' | 'UserSession' | 'WebhookEvent';
export type DbTableName = 'addresses' | 'api_logs' | 'audit_logs' | 'dead_letter_events' | 'email_verification_tokens' | 'file_uploads' | 'files' | 'idempotency_keys' | 'job_logs' | 'login_attempts' | 'outbox_events' | 'password_reset_tokens' | 'payment_attempts' | 'payment_configs' | 'payments' | 'product_images' | 'refunds' | 'saga_states' | 'saved_payment_methods' | 'system_events' | 'user_auth_providers' | 'user_preferences' | 'user_sessions' | 'users' | 'webhook_events';
