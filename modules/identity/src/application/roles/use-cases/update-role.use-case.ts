import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  type RolePersistence,
  CACHE_PORT_TOKEN,
  type CachePort,
} from '@workspace/ports';
import { IdentityErrorCodes, RedisKeyPrefixes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';
import type { UpdateRoleUseCaseInput } from '../dto/role.dto';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
  ) {}

  async execute(id: string, input: UpdateRoleUseCaseInput): Promise<RolePersistence> {
    const existing = await this.roleRepo.findById(id, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND, `Role "${id}" not found`);
    }

    const updated = await this.roleRepo.update(id, input);

    // isActive toggling changes whether this role's permissions are usable —
    // bust so the next permission resolution reflects it immediately.
    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.ROLE_PERMISSIONS, id);

    return updated;
  }
}
