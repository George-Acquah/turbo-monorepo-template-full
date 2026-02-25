-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "events";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notifications";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "search";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateEnum
CREATE TYPE "users"."UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "users"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "users"."AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'FACEBOOK', 'APPLE', 'PHONE');

-- CreateEnum
CREATE TYPE "payments"."PaymentStatus" AS ENUM ('PENDING', 'INITIATED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "payments"."PaymentProvider" AS ENUM ('PAYSTACK', 'FLUTTERWAVE', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "payments"."PaymentMethod" AS ENUM ('CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'USSD', 'QR_CODE', 'CASH');

-- CreateEnum
CREATE TYPE "payments"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "payments"."WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "notifications"."NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'SLACK', 'TELEGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "notifications"."NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "files"."FileType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "files"."FileBucket" AS ENUM ('PRODUCT_IMAGES', 'COLLECTION_ASSETS', 'REVIEW_IMAGES', 'USER_AVATARS', 'INVOICES', 'RECEIPTS', 'GENERAL');

-- CreateEnum
CREATE TYPE "files"."FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'SIGNED');

-- CreateEnum
CREATE TYPE "events"."OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTERED');

-- CreateEnum
CREATE TYPE "events"."DLQEventStatus" AS ENUM ('UNRESOLVED', 'RETRYING', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "events"."SagaStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'COMPENSATING', 'COMPENSATED', 'FAILED');

-- CreateEnum
CREATE TYPE "events"."IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "search"."SearchEntityType" AS ENUM ('PRODUCT', 'COLLECTION', 'CATEGORY', 'BRAND');

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "actor_type" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[],
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."system_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "error_code" TEXT,
    "error_message" TEXT,
    "error_stack" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."api_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" JSONB,
    "body" JSONB,
    "headers" JSONB,
    "status_code" INTEGER NOT NULL,
    "response_body" JSONB,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."job_logs" (
    "id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "job_id" TEXT,
    "queue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" JSONB,
    "output" JSONB,
    "scheduled_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMPTZ(6),
    "error_code" TEXT,
    "error_message" TEXT,
    "error_stack" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "user_id" TEXT,
    "is_successful" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "location" JSONB,
    "device_fingerprint" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."outbox_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "status" "events"."OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."dead_letter_events" (
    "id" TEXT NOT NULL,
    "original_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "error_type" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "error_stack" TEXT,
    "correlation_id" TEXT,
    "total_attempts" INTEGER NOT NULL,
    "status" "events"."DLQEventStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_id" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dead_letter_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."saga_states" (
    "id" TEXT NOT NULL,
    "saga_type" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "status" "events"."SagaStatus" NOT NULL DEFAULT 'STARTED',
    "data" JSONB NOT NULL,
    "order_id" TEXT,
    "payment_id" TEXT,
    "user_id" TEXT,
    "completed_steps" TEXT[],
    "failed_step" TEXT,
    "compensating" BOOLEAN NOT NULL DEFAULT false,
    "last_error" TEXT,
    "timeout_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "saga_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events"."idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_data" JSONB,
    "status_code" INTEGER,
    "status" "events"."IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "entity_type" TEXT,
    "entity_id" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."files" (
    "id" TEXT NOT NULL,
    "bucket" "files"."FileBucket" NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "file_name" TEXT NOT NULL,
    "file_type" "files"."FileType" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "visibility" "files"."FileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "width" INTEGER,
    "height" INTEGER,
    "blurhash" TEXT,
    "uploaded_by_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "caption" TEXT,
    "metadata" JSONB,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."file_uploads" (
    "id" TEXT NOT NULL,
    "bucket" "files"."FileBucket" NOT NULL,
    "key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER,
    "signed_url" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "file_id" TEXT,
    "uploaded_by_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."batch_images" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "is_banner" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channels" "notifications"."NotificationChannel"[],
    "email_subject" TEXT,
    "email_html" TEXT,
    "email_text" TEXT,
    "sms_body" TEXT,
    "push_title" TEXT,
    "push_body" TEXT,
    "push_data" JSONB,
    "in_app_title" TEXT,
    "in_app_body" TEXT,
    "in_app_action" TEXT,
    "slack_message" JSONB,
    "telegram_message" TEXT,
    "whatsapp_template_id" TEXT,
    "whatsapp_params" JSONB,
    "variables" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "notifications"."NotificationChannel" NOT NULL,
    "template_id" TEXT,
    "user_id" TEXT,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "recipient_device" TEXT,
    "recipient_slack" TEXT,
    "recipient_telegram" TEXT,
    "subject" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "html_body" TEXT,
    "data" JSONB,
    "order_id" TEXT,
    "batch_id" TEXT,
    "payment_id" TEXT,
    "status" "notifications"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMPTZ(6),
    "queued_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "provider_id" TEXT,
    "provider_response" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notification_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "notifications"."NotificationStatus" NOT NULL,
    "provider_id" TEXT,
    "provider_response" JSONB,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."in_app_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action_url" TEXT,
    "image_url" TEXT,
    "order_id" TEXT,
    "batch_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."push_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_id" TEXT,
    "device_model" TEXT,
    "os_version" TEXT,
    "app_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notification_configs" (
    "id" TEXT NOT NULL,
    "channel" "notifications"."NotificationChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "api_key" TEXT,
    "api_secret" TEXT,
    "from_email" TEXT,
    "from_name" TEXT,
    "from_phone" TEXT,
    "slack_webhook" TEXT,
    "telegram_bot_token" TEXT,
    "rate_limit" INTEGER,
    "daily_limit" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" "payments"."PaymentProvider" NOT NULL,
    "method" "payments"."PaymentMethod",
    "provider_payment_id" TEXT,
    "provider_reference" TEXT,
    "authorization_code" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "provider_fee" INTEGER,
    "net_amount" INTEGER,
    "status" "payments"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "initiated_at" TIMESTAMPTZ(6),
    "processing_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "expired_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "card_last_4" TEXT,
    "card_brand" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "mobile_network" TEXT,
    "mobile_number" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "customer_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "idempotency_key" TEXT,
    "raw_request" JSONB,
    "raw_response" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_attempts" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "method" "payments"."PaymentMethod",
    "provider_ref" TEXT,
    "status" "payments"."PaymentStatus" NOT NULL,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "raw_response" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_refund_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "payments"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "internal_notes" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "requested_by_id" TEXT,
    "raw_response" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "payments"."PaymentProvider" NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_id" TEXT,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "signature" TEXT,
    "idempotency_key" TEXT,
    "status" "payments"."WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_retry_at" TIMESTAMPTZ(6),
    "payment_id" TEXT,
    "refund_id" TEXT,
    "order_id" TEXT,
    "ip_address" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."saved_payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "payments"."PaymentProvider" NOT NULL,
    "provider_token" TEXT NOT NULL,
    "type" "payments"."PaymentMethod" NOT NULL,
    "display_name" TEXT NOT NULL,
    "card_last_4" TEXT,
    "card_brand" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "mobile_network" TEXT,
    "mobile_number" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_configs" (
    "id" TEXT NOT NULL,
    "provider" "payments"."PaymentProvider" NOT NULL,
    "public_key" TEXT,
    "secret_key" TEXT,
    "webhook_secret" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "supported_methods" "payments"."PaymentMethod"[],
    "fee_percentage" DECIMAL(5,4),
    "fee_fixed" INTEGER,
    "min_amount" INTEGER,
    "max_amount" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search"."search_documents" (
    "id" TEXT NOT NULL,
    "entity_type" "search"."SearchEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "tags" TEXT[],
    "search_vector" tsvector,
    "category_ids" TEXT[],
    "collection_ids" TEXT[],
    "brand_id" TEXT,
    "price" INTEGER,
    "compare_at_price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "wishlist_count" INTEGER NOT NULL DEFAULT 0,
    "is_on_sale" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new_arrival" BOOLEAN NOT NULL DEFAULT false,
    "flash_sale_id" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "slug" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "boost" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search"."search_synonyms" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "synonyms" TEXT[],
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search"."search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized_query" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "result_count" INTEGER NOT NULL,
    "clicked_ids" TEXT[],
    "filters" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search"."popular_searches" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "display_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_searched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "popular_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "supabase_id" TEXT,
    "role" "users"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "users"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "password_hash" TEXT,
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" TEXT,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supabase_created_at" TIMESTAMPTZ(6),
    "supabase_updated_at" TIMESTAMPTZ(6),
    "supabase_deleted_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT,
    "full_name" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'GH',
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shipping_default" BOOLEAN NOT NULL DEFAULT false,
    "is_billing_default" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."user_auth_providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "users"."AuthProvider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "token_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_active_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entity_id_idx" ON "audit"."audit_logs"("entityType", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit"."audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit"."audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "system_events_event_type_event_name_idx" ON "audit"."system_events"("event_type", "event_name");

-- CreateIndex
CREATE INDEX "system_events_source_idx" ON "audit"."system_events"("source");

-- CreateIndex
CREATE INDEX "system_events_entity_type_entity_id_idx" ON "audit"."system_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "system_events_status_idx" ON "audit"."system_events"("status");

-- CreateIndex
CREATE INDEX "system_events_created_at_idx" ON "audit"."system_events"("created_at");

-- CreateIndex
CREATE INDEX "api_logs_method_path_idx" ON "audit"."api_logs"("method", "path");

-- CreateIndex
CREATE INDEX "api_logs_user_id_idx" ON "audit"."api_logs"("user_id");

-- CreateIndex
CREATE INDEX "api_logs_status_code_idx" ON "audit"."api_logs"("status_code");

-- CreateIndex
CREATE INDEX "api_logs_created_at_idx" ON "audit"."api_logs"("created_at");

-- CreateIndex
CREATE INDEX "api_logs_request_id_idx" ON "audit"."api_logs"("request_id");

-- CreateIndex
CREATE INDEX "job_logs_job_name_idx" ON "audit"."job_logs"("job_name");

-- CreateIndex
CREATE INDEX "job_logs_queue_idx" ON "audit"."job_logs"("queue");

-- CreateIndex
CREATE INDEX "job_logs_status_idx" ON "audit"."job_logs"("status");

-- CreateIndex
CREATE INDEX "job_logs_scheduled_at_idx" ON "audit"."job_logs"("scheduled_at");

-- CreateIndex
CREATE INDEX "job_logs_created_at_idx" ON "audit"."job_logs"("created_at");

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "audit"."login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_phone_idx" ON "audit"."login_attempts"("phone");

-- CreateIndex
CREATE INDEX "login_attempts_user_id_idx" ON "audit"."login_attempts"("user_id");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_idx" ON "audit"."login_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "login_attempts_is_successful_idx" ON "audit"."login_attempts"("is_successful");

-- CreateIndex
CREATE INDEX "login_attempts_created_at_idx" ON "audit"."login_attempts"("created_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_idx" ON "events"."outbox_events"("status");

-- CreateIndex
CREATE INDEX "outbox_events_event_type_idx" ON "events"."outbox_events"("event_type");

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "events"."outbox_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "outbox_events_created_at_idx" ON "events"."outbox_events"("created_at");

-- CreateIndex
CREATE INDEX "outbox_events_next_retry_at_idx" ON "events"."outbox_events"("next_retry_at");

-- CreateIndex
CREATE INDEX "outbox_events_correlation_id_idx" ON "events"."outbox_events"("correlation_id");

-- CreateIndex
CREATE INDEX "dead_letter_events_status_idx" ON "events"."dead_letter_events"("status");

-- CreateIndex
CREATE INDEX "dead_letter_events_event_type_idx" ON "events"."dead_letter_events"("event_type");

-- CreateIndex
CREATE INDEX "dead_letter_events_created_at_idx" ON "events"."dead_letter_events"("created_at");

-- CreateIndex
CREATE INDEX "dead_letter_events_aggregate_type_aggregate_id_idx" ON "events"."dead_letter_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE UNIQUE INDEX "saga_states_correlation_id_key" ON "events"."saga_states"("correlation_id");

-- CreateIndex
CREATE INDEX "saga_states_saga_type_idx" ON "events"."saga_states"("saga_type");

-- CreateIndex
CREATE INDEX "saga_states_status_idx" ON "events"."saga_states"("status");

-- CreateIndex
CREATE INDEX "saga_states_order_id_idx" ON "events"."saga_states"("order_id");

-- CreateIndex
CREATE INDEX "saga_states_payment_id_idx" ON "events"."saga_states"("payment_id");

-- CreateIndex
CREATE INDEX "saga_states_timeout_at_idx" ON "events"."saga_states"("timeout_at");

-- CreateIndex
CREATE INDEX "saga_states_started_at_idx" ON "events"."saga_states"("started_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "events"."idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_scope_key_idx" ON "events"."idempotency_keys"("scope", "key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "events"."idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_status_idx" ON "events"."idempotency_keys"("status");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "events"."idempotency_keys"("scope", "key");

-- CreateIndex
CREATE INDEX "files_bucket_idx" ON "files"."files"("bucket");

-- CreateIndex
CREATE INDEX "files_uploaded_by_id_idx" ON "files"."files"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "files_entity_type_entity_id_idx" ON "files"."files"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "files_file_type_idx" ON "files"."files"("file_type");

-- CreateIndex
CREATE INDEX "files_created_at_idx" ON "files"."files"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "files_bucket_key_key" ON "files"."files"("bucket", "key");

-- CreateIndex
CREATE INDEX "file_uploads_bucket_key_idx" ON "files"."file_uploads"("bucket", "key");

-- CreateIndex
CREATE INDEX "file_uploads_uploaded_by_id_idx" ON "files"."file_uploads"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "file_uploads_expires_at_idx" ON "files"."file_uploads"("expires_at");

-- CreateIndex
CREATE INDEX "file_uploads_is_completed_idx" ON "files"."file_uploads"("is_completed");

-- CreateIndex
CREATE INDEX "batch_images_batch_id_idx" ON "files"."batch_images"("batch_id");

-- CreateIndex
CREATE INDEX "batch_images_file_id_idx" ON "files"."batch_images"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_images_batch_id_file_id_key" ON "files"."batch_images"("batch_id", "file_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notifications"."notification_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_slug_key" ON "notifications"."notification_templates"("slug");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notifications"."notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notifications"."notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_type_channel_idx" ON "notifications"."notifications"("type", "channel");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "notifications"."notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_order_id_idx" ON "notifications"."notifications"("order_id");

-- CreateIndex
CREATE INDEX "notifications_batch_id_idx" ON "notifications"."notifications"("batch_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "notification_logs_notification_id_idx" ON "notifications"."notification_logs"("notification_id");

-- CreateIndex
CREATE INDEX "notification_logs_created_at_idx" ON "notifications"."notification_logs"("created_at");

-- CreateIndex
CREATE INDEX "in_app_notifications_user_id_idx" ON "notifications"."in_app_notifications"("user_id");

-- CreateIndex
CREATE INDEX "in_app_notifications_user_id_is_read_idx" ON "notifications"."in_app_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "in_app_notifications_created_at_idx" ON "notifications"."in_app_notifications"("created_at");

-- CreateIndex
CREATE INDEX "in_app_notifications_expires_at_idx" ON "notifications"."in_app_notifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_token_key" ON "notifications"."push_devices"("token");

-- CreateIndex
CREATE UNIQUE INDEX "notification_configs_channel_key" ON "notifications"."notification_configs"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"."payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"."payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"."payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "payments_provider_reference_idx" ON "payments"."payments"("provider_reference");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"."payments"("created_at");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"."payments"("customer_id");

-- CreateIndex
CREATE INDEX "payment_attempts_payment_id_idx" ON "payments"."payment_attempts"("payment_id");

-- CreateIndex
CREATE INDEX "payment_attempts_created_at_idx" ON "payments"."payment_attempts"("created_at");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "payments"."refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "payments"."refunds"("order_id");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "payments"."refunds"("status");

-- CreateIndex
CREATE INDEX "refunds_created_at_idx" ON "payments"."refunds"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_idempotency_key_key" ON "payments"."webhook_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "webhook_events_provider_event_type_idx" ON "payments"."webhook_events"("provider", "event_type");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "payments"."webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_created_at_idx" ON "payments"."webhook_events"("created_at");

-- CreateIndex
CREATE INDEX "webhook_events_payment_id_idx" ON "payments"."webhook_events"("payment_id");

-- CreateIndex
CREATE INDEX "webhook_events_order_id_idx" ON "payments"."webhook_events"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "payments"."webhook_events"("provider", "event_id");

-- CreateIndex
CREATE INDEX "saved_payment_methods_user_id_idx" ON "payments"."saved_payment_methods"("user_id");

-- CreateIndex
CREATE INDEX "saved_payment_methods_user_id_is_default_idx" ON "payments"."saved_payment_methods"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "saved_payment_methods_provider_idx" ON "payments"."saved_payment_methods"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "payment_configs_provider_key" ON "payments"."payment_configs"("provider");

-- CreateIndex
CREATE INDEX "search_documents_entity_type_idx" ON "search"."search_documents"("entity_type");

-- CreateIndex
CREATE INDEX "search_documents_is_active_idx" ON "search"."search_documents"("is_active");

-- CreateIndex
CREATE INDEX "search_documents_in_stock_idx" ON "search"."search_documents"("in_stock");

-- CreateIndex
CREATE INDEX "search_documents_price_idx" ON "search"."search_documents"("price");

-- CreateIndex
CREATE INDEX "search_documents_rating_idx" ON "search"."search_documents"("rating");

-- CreateIndex
CREATE INDEX "search_documents_sales_count_idx" ON "search"."search_documents"("sales_count");

-- CreateIndex
CREATE INDEX "search_documents_is_featured_idx" ON "search"."search_documents"("is_featured");

-- CreateIndex
CREATE INDEX "search_documents_is_on_sale_idx" ON "search"."search_documents"("is_on_sale");

-- CreateIndex
CREATE INDEX "search_documents_created_at_idx" ON "search"."search_documents"("created_at");

-- CreateIndex
CREATE INDEX "search_documents_category_ids_idx" ON "search"."search_documents" USING GIN ("category_ids");

-- CreateIndex
CREATE INDEX "search_documents_collection_ids_idx" ON "search"."search_documents" USING GIN ("collection_ids");

-- CreateIndex
CREATE INDEX "search_documents_tags_idx" ON "search"."search_documents" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "search_documents_entity_type_entity_id_key" ON "search"."search_documents"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "search_synonyms_term_key" ON "search"."search_synonyms"("term");

-- CreateIndex
CREATE INDEX "search_synonyms_term_idx" ON "search"."search_synonyms"("term");

-- CreateIndex
CREATE INDEX "search_synonyms_is_active_idx" ON "search"."search_synonyms"("is_active");

-- CreateIndex
CREATE INDEX "search_queries_normalized_query_idx" ON "search"."search_queries"("normalized_query");

-- CreateIndex
CREATE INDEX "search_queries_user_id_idx" ON "search"."search_queries"("user_id");

-- CreateIndex
CREATE INDEX "search_queries_created_at_idx" ON "search"."search_queries"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "popular_searches_query_key" ON "search"."popular_searches"("query");

-- CreateIndex
CREATE INDEX "popular_searches_is_active_score_idx" ON "search"."popular_searches"("is_active", "score" DESC);

-- CreateIndex
CREATE INDEX "popular_searches_search_count_idx" ON "search"."popular_searches"("search_count");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"."users"("supabase_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"."users"("phone");

-- CreateIndex
CREATE INDEX "users_supabase_id_idx" ON "users"."users"("supabase_id");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"."users"("role", "status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"."users"("created_at");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "users"."addresses"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_is_default_idx" ON "users"."addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "user_auth_providers_user_id_idx" ON "users"."user_auth_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_providers_provider_provider_id_key" ON "users"."user_auth_providers"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "users"."user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "users"."user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "users"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_token_idx" ON "users"."user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "users"."user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "users"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "users"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "users"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "users"."password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "users"."email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "users"."email_verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "users"."email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expires_at_idx" ON "users"."email_verification_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "notifications"."notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_auth_providers" ADD CONSTRAINT "user_auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
