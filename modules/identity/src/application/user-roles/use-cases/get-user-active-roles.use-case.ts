import { Inject, Injectable } from '@nestjs/common';
import {
  USER_ROLE_REPOSITORY_TOKEN,
  type UserRoleRepositoryPort,
  type UserRoleWithRolePersistence,
} from '@workspace/ports';

@Injectable()
export class GetUserActiveRolesUseCase {
  constructor(
    @Inject(USER_ROLE_REPOSITORY_TOKEN) private readonly userRoleRepo: UserRoleRepositoryPort,
  ) {}

  async execute(userId: string): Promise<UserRoleWithRolePersistence[]> {
    return this.userRoleRepo.findActiveAssignments(userId);
  }
}
