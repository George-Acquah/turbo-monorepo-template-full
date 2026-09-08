import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ContextPort } from '@workspace/ports';
import { PermissionsGuard } from '../../src/guards/permissions.guard';
import type { PermissionResolverService } from '../../src/services/permission-resolver.service';

function fakeExecutionContext(): ExecutionContext {
  return {
    getHandler: () => (() => undefined),
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof jest.fn> };
  let permissionResolver: { hasPermission: ReturnType<typeof jest.fn> };
  let context: { getUserId: ReturnType<typeof jest.fn> };
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    permissionResolver = { hasPermission: jest.fn() };
    context = { getUserId: jest.fn().mockReturnValue('usr_1') };

    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      permissionResolver as unknown as PermissionResolverService,
      context as unknown as ContextPort,
    );
  });

  // Deliberate behaviour change: this guard used to return true when no
  // @RequirePermission was present, on the reasoning that "no requirement means
  // no restriction". In practice it meant a route that listed the guard but
  // forgot the decorator silently degraded to "any authenticated user" — which
  // is exactly how the entire audit read surface (7 routes over cross-account
  // PII) shipped open. Applying the guard IS the statement of intent, so a
  // missing decorator is now an error rather than a grant.
  it('refuses the request when the route has no @RequirePermission metadata (fails closed)', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(fakeExecutionContext())).rejects.toThrow(ForbiddenException);
    expect(permissionResolver.hasPermission).not.toHaveBeenCalled();
  });

  it('allows the request when the caller has the required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resource: 'refund', action: 'approve' });
    permissionResolver.hasPermission.mockResolvedValue(true);

    await expect(guard.canActivate(fakeExecutionContext())).resolves.toBe(true);
    expect(permissionResolver.hasPermission).toHaveBeenCalledWith('usr_1', 'refund', 'approve');
  });

  it('throws ForbiddenException when the caller lacks the required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue({ resource: 'refund', action: 'approve' });
    permissionResolver.hasPermission.mockResolvedValue(false);

    await expect(guard.canActivate(fakeExecutionContext())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
