import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  CACHE_PORT_TOKEN,
  type CachePort,
} from '@workspace/ports';
import { IdentityErrorCodes, RedisKeyPrefixes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.roleRepo.findById(id, { select: ['id'] });
    if (!existing) {
      throw new NotFoundAppException(IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND, `Role "${id}" not found`);
    }

    await this.roleRepo.softDelete(id);
    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.ROLE_PERMISSIONS, id);
  }
}
