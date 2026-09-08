import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY_TOKEN,
  type PermissionRepositoryPort,
  type PermissionPersistence,
} from '@workspace/ports';
import { IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';
import type { UpdatePermissionUseCaseInput } from '../dto/permission.dto';

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(id: string, input: UpdatePermissionUseCaseInput): Promise<PermissionPersistence> {
    const existing = await this.permissionRepo.findById(id, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_NOT_FOUND,
        `Permission "${id}" not found`,
      );
    }

    return this.permissionRepo.update(id, input);
  }
}
