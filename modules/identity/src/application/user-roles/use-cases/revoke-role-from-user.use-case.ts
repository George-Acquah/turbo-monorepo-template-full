import { Inject, Injectable } from '@nestjs/common';
import {
  USER_ROLE_REPOSITORY_TOKEN,
  type UserRoleRepositoryPort,
  ROLE_REPOSITORY_TOKEN,
  type RoleRepositoryPort,
  CACHE_PORT_TOKEN,
  type CachePort,
  EVENT_PUBLISHER_TOKEN,
  type EventPublisherPort,
  TRANSACTION_PORT_TOKEN,
  type TransactionPort,
  type DatabaseTx,
} from '@workspace/ports';
import { AggregateType, IdentityErrorCodes, RedisKeyPrefixes } from '@workspace/constants';
import { IdentityEvents } from '@workspace/types';
import { NotFoundAppException } from '@workspace/utils';
import type { RevokeRoleFromUserUseCaseInput } from '../dto/user-role.dto';

@Injectable()
export class RevokeRoleFromUserUseCase {
  constructor(
    @Inject(USER_ROLE_REPOSITORY_TOKEN) private readonly userRoleRepo: UserRoleRepositoryPort,
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(input: RevokeRoleFromUserUseCaseInput): Promise<void> {
    const role = await this.roleRepo.findById(input.roleId, { select: ['id', 'key'] });
    if (!role) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND,
        `Role "${input.roleId}" not found`,
      );
    }

    const activeAssignments = await this.userRoleRepo.findActiveAssignments(input.userId);
    const existing = activeAssignments.find((a) => a.roleId === input.roleId);
    if (!existing) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_ROLE_ASSIGNMENT_NOT_FOUND,
        `User "${input.userId}" has no active assignment for role "${role.key}"`,
      );
    }

    await this.transactionPort.execute(async (tx) => {
      await this.userRoleRepo.revoke(input.userId, { roleId: input.roleId }, tx as DatabaseTx);

      await this.publisher.publishWithTransaction(tx, {
        eventType: IdentityEvents.ROLE_REVOKED,
        aggregateType: AggregateType.USER_ROLE,
        aggregateId: existing.id,
        userId: input.userId,
        payload: {
          userId: input.userId,
          roleId: role.id,
          roleKey: role.key,
        },
      });
    });

    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.USER_ROLES, input.userId);
  }
}
