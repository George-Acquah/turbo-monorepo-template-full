import { CheckConstraintSpec } from './constraint.types';
import {
  AuthConstraints,
  IdentityConstraints,
  ProfilesConstraints,
  NotificationsConstraints,
  FilesConstraints,
  AuditConstraints,
  OutboxConstraints,
} from './constraints';

// One entry per bounded-context .prisma file, in the same order as
// schema.prisma's datasource `schemas` list.
export const DatabaseConstraintRegistry: readonly CheckConstraintSpec[] = [
  ...AuthConstraints,
  ...IdentityConstraints,
  ...ProfilesConstraints,
  ...NotificationsConstraints,
  ...FilesConstraints,
  ...AuditConstraints,
  ...OutboxConstraints,
];
