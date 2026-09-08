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
  type UserRolePersistence,
} from '@workspace/ports';
import { AggregateType, IdentityErrorCodes, IdPrefixes, RedisKeyPrefixes } from '@workspace/constants';
import { IdentityEvents } from '@workspace/types';
import { ConflictAppException, NotFoundAppException, createIdentifier } from '@workspace/utils';
import type { AssignRoleToUserUseCaseInput } from '../dto/user-role.dto';

const UserRoleId = createIdentifier(IdPrefixes.USER_ROLE);

@Injectable()
export class AssignRoleToUserUseCase {
  constructor(
    @Inject(USER_ROLE_REPOSITORY_TOKEN) private readonly userRoleRepo: UserRoleRepositoryPort,
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: RoleRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(TRANSACTION_PORT_TOKEN) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(input: AssignRoleToUserUseCaseInput): Promise<UserRolePersistence> {
    const role = await this.roleRepo.findById(input.roleId, { select: ['id', 'key', 'isActive'] });
    if (!role) {
      throw new NotFoundAppException(
        IdentityErrorCodes.IDENTITY_ROLE_NOT_FOUND,
        `Role "${input.roleId}" not found`,
      );
    }

    const activeAssignments = await this.userRoleRepo.findActiveAssignments(input.userId);
    if (activeAssignments.some((a) => a.roleId === input.roleId)) {
      throw new ConflictAppException(
        IdentityErrorCodes.IDENTITY_ROLE_ALREADY_ASSIGNED,
        `User "${input.userId}" already has an active assignment for role "${role.key}"`,
      );
    }

    const assignment = await this.transactionPort.execute(async (tx) => {
      const created = await this.userRoleRepo.assign(
        {
          id: UserRoleId.generate(),
          userId: input.userId,
          roleId: input.roleId,
          roleKey: role.key,
          grantedBy: input.grantedBy ?? null,
          expiresAt: input.expiresAt ?? null,
        },
        tx as DatabaseTx,
      );

      await this.publisher.publishWithTransaction(tx, {
        eventType: IdentityEvents.ROLE_ASSIGNED,
        aggregateType: AggregateType.USER_ROLE,
        aggregateId: created.id,
        userId: input.userId,
        payload: {
          userId: input.userId,
          roleId: role.id,
          roleKey: role.key,
          grantedBy: input.grantedBy ?? undefined,
          expiresAt: input.expiresAt?.toISOString(),
        },
      });

      return created;
    });

    await this.cache.deleteEntity(RedisKeyPrefixes.IDENTITY.USER_ROLES, input.userId);

    return assignment;
  }
}
