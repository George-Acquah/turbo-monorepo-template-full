import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY_TOKEN,
  type UserRepositoryPort,
  type AuthApplicationPort,
  type UserContact,
} from '@workspace/ports';

/**
 * Implements `AuthApplicationPort` — the sanctioned cross-context seam
 * other modules use instead of importing `ports/database/schema/auth/**`
 * directly. Bound to `AUTH_APPLICATION_TOKEN` in `AuthApplicationPortModule`.
 * Mirrors `ProfilesApplicationService.getProfileContact`'s exact shape.
 */
@Injectable()
export class AuthApplicationService implements AuthApplicationPort {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: UserRepositoryPort) {}

  async getUserContact(userId: string): Promise<UserContact | null> {
    const user = await this.userRepo.findById(userId, {
      select: ['email', 'firstName', 'lastName'],
    });
    if (!user?.email) return null;
    return { email: user.email, firstName: user.firstName, lastName: user.lastName };
  }
}
