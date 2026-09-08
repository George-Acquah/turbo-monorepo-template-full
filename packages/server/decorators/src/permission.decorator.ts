import { applyDecorators, SetMetadata } from '@nestjs/common';
import { PermissionMetadata } from '@workspace/types';
import { Roles } from './roles.decorator';
import { Action, DecoratorKeys, Resource, SystemRoleKey } from '@workspace/constants';

export const RequirePermission = (
  action: Action | string,
  resource: Resource | string,
  options: Omit<PermissionMetadata, 'action' | 'resource'> = {},
) =>
  SetMetadata(DecoratorKeys.PERMISSION, {
    action,
    resource,
    ...options,
  } satisfies PermissionMetadata);

// Was `Roles(...[])` — an empty roles array, not "admin only". Fixed to
// actually restrict to the platform_admin seed role (doc 06 §3).
export const AdminOnly = () => applyDecorators(Roles(SystemRoleKey.PLATFORM_ADMIN));
