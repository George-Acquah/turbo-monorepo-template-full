import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  type RolePersistence,
} from '@workspace/ports';
import { IdentityErrorCodes, IdPrefixes } from '@workspace/constants';
import { ConflictAppException, createIdentifier } from '@workspace/utils';
import type { CreateRoleUseCaseInput } from '../dto/role.dto';

const RoleId = createIdentifier(IdPrefixes.ROLE);

@Injectable()
export class CreateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort) {}

  async execute(input: CreateRoleUseCaseInput): Promise<RolePersistence> {
    const existing = await this.roleRepo.findByKey(input.key, { select: ['id'] });
    if (existing) {
      throw new ConflictAppException(
        IdentityErrorCodes.IDENTITY_ROLE_ALREADY_EXISTS,
        `A role with key "${input.key}" already exists`,
      );
    }

    return this.roleRepo.create({
      id: RoleId.generate(),
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      isSystem: input.isSystem ?? false,
      isActive: input.isActive ?? true,
      createdByUserId: input.createdByUserId ?? null,
      metadata: input.metadata ?? null,
    });
  }
}
