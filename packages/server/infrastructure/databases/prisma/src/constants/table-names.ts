// GENERATED FILE — DO NOT EDIT BY HAND
// It provides a syntatic sugar for your table names at build and run time  
// Run: pnpm -w -C packages/database run generate:table-names

export const MODEL_TO_TABLE = {
  "AuditLog": {
    "table": "audit_logs",
    "schema": "workspace_audit"
  },
  "SystemEvent": {
    "table": "system_events",
    "schema": "workspace_audit"
  },
  "ApiLog": {
    "table": "api_logs",
    "schema": "workspace_audit"
  },
  "JobLog": {
    "table": "job_logs",
    "schema": "workspace_audit"
  },
  "LoginAttempt": {
    "table": "login_attempts",
    "schema": "workspace_audit"
  },
  "User": {
    "table": "users",
    "schema": "workspace_auth"
  },
  "UserAuthProvider": {
    "table": "user_auth_providers",
    "schema": "workspace_auth"
  },
  "UserPreference": {
    "table": "user_preferences",
    "schema": "workspace_auth"
  },
  "UserSession": {
    "table": "user_sessions",
    "schema": "workspace_auth"
  },
  "UserDevice": {
    "table": "user_devices",
    "schema": "workspace_auth"
  },
  "PasswordResetToken": {
    "table": "password_reset_tokens",
    "schema": "workspace_auth"
  },
  "EmailVerificationToken": {
    "table": "email_verification_tokens",
    "schema": "workspace_auth"
  },
  "PendingInvitation": {
    "table": "pending_invitations",
    "schema": "workspace_auth"
  },
  "TwoFactorEnrollment": {
    "table": "two_factor_enrollments",
    "schema": "workspace_auth"
  },
  "Order": {
    "table": "orders",
    "schema": "workspace_billing"
  },
  "OrderItem": {
    "table": "order_items",
    "schema": "workspace_billing"
  },
  "Invoice": {
    "table": "invoices",
    "schema": "workspace_billing"
  },
  "Payment": {
    "table": "payments",
    "schema": "workspace_billing"
  },
  "PaymentAttempt": {
    "table": "payment_attempts",
    "schema": "workspace_billing"
  },
  "Refund": {
    "table": "refunds",
    "schema": "workspace_billing"
  },
  "WebhookEvent": {
    "table": "webhook_events",
    "schema": "workspace_billing"
  },
  "SavedPaymentMethod": {
    "table": "saved_payment_methods",
    "schema": "workspace_billing"
  },
  "PaymentConfig": {
    "table": "payment_configs",
    "schema": "workspace_billing"
  },
  "Programme": {
    "table": "programmes",
    "schema": "workspace_catalog"
  },
  "PricePlan": {
    "table": "price_plans",
    "schema": "workspace_catalog"
  },
  "Cohort": {
    "table": "cohorts",
    "schema": "workspace_catalog"
  },
  "Masterclass": {
    "table": "masterclasses",
    "schema": "workspace_catalog"
  },
  "Enrolment": {
    "table": "enrolments",
    "schema": "workspace_enrolments"
  },
  "LiveEvent": {
    "table": "live_events",
    "schema": "workspace_events"
  },
  "EventRegistration": {
    "table": "event_registrations",
    "schema": "workspace_events"
  },
  "EventReplay": {
    "table": "event_replays",
    "schema": "workspace_events"
  },
  "FileRecord": {
    "table": "file_records",
    "schema": "workspace_files"
  },
  "FileUpload": {
    "table": "file_uploads",
    "schema": "workspace_files"
  },
  "Permission": {
    "table": "permissions",
    "schema": "workspace_identity"
  },
  "Role": {
    "table": "roles",
    "schema": "workspace_identity"
  },
  "RolePermission": {
    "table": "role_permissions",
    "schema": "workspace_identity"
  },
  "UserRole": {
    "table": "user_roles",
    "schema": "workspace_identity"
  },
  "ApiClient": {
    "table": "api_clients",
    "schema": "workspace_identity"
  },
  "ApiKey": {
    "table": "api_keys",
    "schema": "workspace_identity"
  },
  "Course": {
    "table": "courses",
    "schema": "workspace_learning"
  },
  "CourseModule": {
    "table": "course_modules",
    "schema": "workspace_learning"
  },
  "Lesson": {
    "table": "lessons",
    "schema": "workspace_learning"
  },
  "LessonResource": {
    "table": "lesson_resources",
    "schema": "workspace_learning"
  },
  "LessonProgress": {
    "table": "lesson_progress",
    "schema": "workspace_learning"
  },
  "CohortSchedule": {
    "table": "cohort_schedules",
    "schema": "workspace_learning"
  },
  "Subscription": {
    "table": "subscriptions",
    "schema": "workspace_memberships"
  },
  "AccessGrant": {
    "table": "access_grants",
    "schema": "workspace_memberships"
  },
  "CommunityLink": {
    "table": "community_links",
    "schema": "workspace_memberships"
  },
  "NotificationTemplate": {
    "table": "notification_templates",
    "schema": "workspace_notifications"
  },
  "NotificationPreference": {
    "table": "notification_preferences",
    "schema": "workspace_notifications"
  },
  "CommunicationPreferenceOverride": {
    "table": "communication_preference_overrides",
    "schema": "workspace_notifications"
  },
  "NotificationChannelConfig": {
    "table": "notification_channel_configs",
    "schema": "workspace_notifications"
  },
  "PushDevice": {
    "table": "push_devices",
    "schema": "workspace_notifications"
  },
  "OutboxEvent": {
    "table": "outbox_events",
    "schema": "workspace_outbox"
  },
  "DeadLetterEvent": {
    "table": "dead_letter_events",
    "schema": "workspace_outbox"
  },
  "SagaState": {
    "table": "saga_states",
    "schema": "workspace_outbox"
  },
  "IdempotencyKey": {
    "table": "idempotency_keys",
    "schema": "workspace_outbox"
  },
  "MemberProfile": {
    "table": "member_profiles",
    "schema": "workspace_profiles"
  },
  "ConsentRecord": {
    "table": "consent_records",
    "schema": "workspace_profiles"
  }
} as const;
export const TABLE_TO_MODEL = {
  "audit_logs": "AuditLog",
  "system_events": "SystemEvent",
  "api_logs": "ApiLog",
  "job_logs": "JobLog",
  "login_attempts": "LoginAttempt",
  "users": "User",
  "user_auth_providers": "UserAuthProvider",
  "user_preferences": "UserPreference",
  "user_sessions": "UserSession",
  "user_devices": "UserDevice",
  "password_reset_tokens": "PasswordResetToken",
  "email_verification_tokens": "EmailVerificationToken",
  "pending_invitations": "PendingInvitation",
  "two_factor_enrollments": "TwoFactorEnrollment",
  "orders": "Order",
  "order_items": "OrderItem",
  "invoices": "Invoice",
  "payments": "Payment",
  "payment_attempts": "PaymentAttempt",
  "refunds": "Refund",
  "webhook_events": "WebhookEvent",
  "saved_payment_methods": "SavedPaymentMethod",
  "payment_configs": "PaymentConfig",
  "programmes": "Programme",
  "price_plans": "PricePlan",
  "cohorts": "Cohort",
  "masterclasses": "Masterclass",
  "enrolments": "Enrolment",
  "live_events": "LiveEvent",
  "event_registrations": "EventRegistration",
  "event_replays": "EventReplay",
  "file_records": "FileRecord",
  "file_uploads": "FileUpload",
  "permissions": "Permission",
  "roles": "Role",
  "role_permissions": "RolePermission",
  "user_roles": "UserRole",
  "api_clients": "ApiClient",
  "api_keys": "ApiKey",
  "courses": "Course",
  "course_modules": "CourseModule",
  "lessons": "Lesson",
  "lesson_resources": "LessonResource",
  "lesson_progress": "LessonProgress",
  "cohort_schedules": "CohortSchedule",
  "subscriptions": "Subscription",
  "access_grants": "AccessGrant",
  "community_links": "CommunityLink",
  "notification_templates": "NotificationTemplate",
  "notification_preferences": "NotificationPreference",
  "communication_preference_overrides": "CommunicationPreferenceOverride",
  "notification_channel_configs": "NotificationChannelConfig",
  "push_devices": "PushDevice",
  "outbox_events": "OutboxEvent",
  "dead_letter_events": "DeadLetterEvent",
  "saga_states": "SagaState",
  "idempotency_keys": "IdempotencyKey",
  "member_profiles": "MemberProfile",
  "consent_records": "ConsentRecord"
} as const;

export type PrismaModelName = 'AccessGrant' | 'ApiClient' | 'ApiKey' | 'ApiLog' | 'AuditLog' | 'Cohort' | 'CohortSchedule' | 'CommunicationPreferenceOverride' | 'CommunityLink' | 'ConsentRecord' | 'Course' | 'CourseModule' | 'DeadLetterEvent' | 'EmailVerificationToken' | 'Enrolment' | 'EventRegistration' | 'EventReplay' | 'FileRecord' | 'FileUpload' | 'IdempotencyKey' | 'Invoice' | 'JobLog' | 'Lesson' | 'LessonProgress' | 'LessonResource' | 'LiveEvent' | 'LoginAttempt' | 'Masterclass' | 'MemberProfile' | 'NotificationChannelConfig' | 'NotificationPreference' | 'NotificationTemplate' | 'Order' | 'OrderItem' | 'OutboxEvent' | 'PasswordResetToken' | 'Payment' | 'PaymentAttempt' | 'PaymentConfig' | 'PendingInvitation' | 'Permission' | 'PricePlan' | 'Programme' | 'PushDevice' | 'Refund' | 'Role' | 'RolePermission' | 'SagaState' | 'SavedPaymentMethod' | 'Subscription' | 'SystemEvent' | 'TwoFactorEnrollment' | 'User' | 'UserAuthProvider' | 'UserDevice' | 'UserPreference' | 'UserRole' | 'UserSession' | 'WebhookEvent';
export type DbTableName = 'access_grants' | 'api_clients' | 'api_keys' | 'api_logs' | 'audit_logs' | 'cohort_schedules' | 'cohorts' | 'communication_preference_overrides' | 'community_links' | 'consent_records' | 'course_modules' | 'courses' | 'dead_letter_events' | 'email_verification_tokens' | 'enrolments' | 'event_registrations' | 'event_replays' | 'file_records' | 'file_uploads' | 'idempotency_keys' | 'invoices' | 'job_logs' | 'lesson_progress' | 'lesson_resources' | 'lessons' | 'live_events' | 'login_attempts' | 'masterclasses' | 'member_profiles' | 'notification_channel_configs' | 'notification_preferences' | 'notification_templates' | 'order_items' | 'orders' | 'outbox_events' | 'password_reset_tokens' | 'payment_attempts' | 'payment_configs' | 'payments' | 'pending_invitations' | 'permissions' | 'price_plans' | 'programmes' | 'push_devices' | 'refunds' | 'role_permissions' | 'roles' | 'saga_states' | 'saved_payment_methods' | 'subscriptions' | 'system_events' | 'two_factor_enrollments' | 'user_auth_providers' | 'user_devices' | 'user_preferences' | 'user_roles' | 'user_sessions' | 'users' | 'webhook_events';
