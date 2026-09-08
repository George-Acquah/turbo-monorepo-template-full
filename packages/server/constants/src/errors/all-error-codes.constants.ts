import { AuthErrorCodes } from './auth-error.constants';
import { IdentityErrorCodes } from './identity-error.constants';
import { ProfileErrorCodes } from './profile-error.constants';
import { NotificationErrorCodes } from './notification-error.constants';
import { FileErrorCodes } from './file-error.constants';
import { AuditErrorCodes } from './audit-error.constants';
import { WorkflowErrorCodes } from './workflow-error.constants';
import { QueueErrorCodes } from './queue-error.constants';
import { CommonErrorCodes } from './common-error.constants';

// ── all error codes union ────────────────────────────────────────────────────
export const AllErrorCodes = {
  ...AuthErrorCodes,
  ...IdentityErrorCodes,
  ...ProfileErrorCodes,
  ...NotificationErrorCodes,
  ...FileErrorCodes,
  ...AuditErrorCodes,
  ...WorkflowErrorCodes,
  ...QueueErrorCodes,
  ...CommonErrorCodes,
} as const;

export type ErrorCode = (typeof AllErrorCodes)[keyof typeof AllErrorCodes];
