import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  type RolePersistence,
} from '@workspace/ports';
import { IdentityErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort) {}

  async execute(id: string): Promise<RolePersistence> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundAppException(IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND, `Role "${id}" not found`);
    }
    return role;
  }
}
