/**
 * Current User Decorator
 *
 * Extracts user information from the request object.
 * Used with JWT authentication guards.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@repo/types';

/**
 * Extract current user from request.
 *
 * @example
 * ```typescript
 * // Get entire user object
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return this.userService.getUserById(user.sub);
 * }
 *
 * // Get specific property
 * @Get('profile')
 * getProfile(@CurrentUser('sub') userId: string) {
 *   return this.userService.getUserById(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
