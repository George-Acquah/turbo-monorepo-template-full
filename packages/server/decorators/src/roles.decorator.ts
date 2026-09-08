import { SetMetadata } from '@nestjs/common';
import { DecoratorKeys, SystemRoleKey } from '@workspace/constants';

export const Roles = (...roles: SystemRoleKey[]) => SetMetadata(DecoratorKeys.ROLES, roles);
