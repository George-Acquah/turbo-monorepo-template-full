import { Action, Resource, SystemRoleKey } from '@workspace/constants';

export * from './als-request.interface';
export * from './user.interface';
export * from './payment-link-identity.interface';
export * from './pagination.interface';
export * from './http.interface';
export * from './queues.interface';
export * from './rate-limit.interface';
export * from './auth.interface';
export * from './route.interface';

export type PermissionMetadata = {
  action: Action | string;
  resource: Resource | string;
  roles?: SystemRoleKey[];
};
