import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, type UserRepositoryPort } from '@workspace/ports';
import { AuthErrorCodes } from '@workspace/constants';
import { UnauthorizedAppException } from '@workspace/utils';
import type { CurrentUser } from '../dto';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string): Promise<CurrentUser> {
    const user = await this.userRepo.findById(userId, {
      select: ['id', 'email', 'firstName', 'lastName', 'userType', 'status', 'emailVerified'],
    });
    if (!user) throw new UnauthorizedAppException(AuthErrorCodes.AUTH_UNAUTHORIZED, 'User not found');
    return user;
  }
}
