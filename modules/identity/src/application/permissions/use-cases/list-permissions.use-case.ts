import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY_TOKEN,
  type PermissionRepositoryPort,
  type PermissionPersistence,
} from '@workspace/ports';
import type { ListPermissionsUseCaseInput } from '../dto/permission.dto';

@Injectable()
export class ListPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: PermissionRepositoryPort,
  ) {}

  async execute(input: ListPermissionsUseCaseInput): Promise<PermissionPersistence[]> {
    return this.permissionRepo.findMany({ resource: input.resource, isActive: input.isActive });
  }
}
