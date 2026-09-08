import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  type RolePersistence,
} from '@workspace/ports';
import type { ListRolesUseCaseInput } from '../dto/role.dto';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort) {}

  async execute(input: ListRolesUseCaseInput): Promise<RolePersistence[]> {
    return this.roleRepo.findMany({ isActive: input.isActive });
  }
}
