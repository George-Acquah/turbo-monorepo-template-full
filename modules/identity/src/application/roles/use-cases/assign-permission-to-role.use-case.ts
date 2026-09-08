import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  PERMISSION_REPOSITORY_TOKEN,
  type PermissionRepositoryPort,
  CACHE_PORT_TOKEN,
  type CachePort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
  type RolePermissionPersistence,
} from '@workspace/ports';
import { AggregateType, IdentityErrorCodes, RedisKeyPrefixes } from '@workspace/constants';
import { IdentityEvents } from '@workspace/types';
import { NotFoundAppException } from '@workspace/utils';
import type { AssignPermissionToRoleUseCaseInput } from '../dto/role.dto';

@Injectable()
export class AssignPermissionToRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: PermissionRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(input: AssignPermissionToRoleUseCaseInput): Promise<RolePermissionPersistence> {
    const role = await this.roleRepo.findById(input.roleId, { select: ['id', 'key'] });
    if (!role) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND,
        `Role "${input.roleId}" not found`,
      );
    }

    const permission = await this.permissionRepo.findById(input.permissionId, { select: ['id', 'key'] });
    if (!permission) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_PERMISSION_NOT_FOUND,
        `Permission "${input.permissionId}" not found`,
      );
    }

    const link = await this.transactionPort.execute(async (tx) => {
      const assigned = await this.roleRepo.assignPermission(
        {
          roleId: input.roleId,
          permissionId: input.permissionId,
          createdByUserId: input.grantedByUserId ?? null,
        },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: IdentityEvents.PERMISSION_GRANTED_TO_ROLE,
        aggregateType: AggregateType.ROLE,
        aggregateId: role.id,
        userId: input.grantedByUserId ?? undefined,
        payload: {
          roleId: role.id,
          roleKey: role.key,
          permissionId: permission.id,
          permissionKey: permission.key,
          grantedByUserId: input.grantedByUserId ?? undefined,
        },
      });

      return assigned;
    });

    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.ROLE_PERMISSIONS, input.roleId);

    return link;
  }
}
