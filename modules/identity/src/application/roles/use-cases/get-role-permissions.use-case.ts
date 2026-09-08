import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
} from '@workspace/ports';
import { IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetRolePermissionsUseCase {
  constructor(@Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort) {}

  async execute(roleId: string): Promise<string[]> {
    const role = await this.roleRepo.findById(roleId, { select: ['id'] });
    if (!role) {
      throw new NotFoundAppException(IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND, `Role "${roleId}" not found`);
    }

    return this.roleRepo.findRolePermissions(roleId);
  }
}
