import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY_TOKEN,
  type PermissionRepositoryPort,
  type PermissionPersistence,
} from '@workspace/ports';
import { IdentityErrorCodes, IdPrefixes } from '@workspace/constants';
import { ConflictAppException, createIdentifier } from '@workspace/utils';
import type { CreatePermissionUseCaseInput } from '../dto/permission.dto';

const PermissionId = createIdentifier(IdPrefixes.PERMISSION);

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(input: CreatePermissionUseCaseInput): Promise<PermissionPersistence> {
    // `input.key` is always machine-derived as `${resource}:${action}` by
    // now (`CreatePermissionDto`'s `@Transform`) — unlike a slug, a colliding
    // key genuinely means "a permission for this exact resource+action pair
    // already exists," which is a real duplicate, not something to silently
    // paper over with a suffix. Still a hard reject.
    const existing = await this.permissionRepo.findByKey(input.key, { select: ['id'] });
    if (existing) {
      throw new ConflictAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_ALREADY_EXISTS,
        `A permission with key "${input.key}" already exists`,
      );
    }

    return this.permissionRepo.create({
      id: PermissionId.generate(),
      key: input.key,
      resource: input.resource,
      action: input.action,
      description: input.description ?? null,
      isSystem: input.isSystem ?? false,
      isActive: input.isActive ?? true,
    });
  }
}
