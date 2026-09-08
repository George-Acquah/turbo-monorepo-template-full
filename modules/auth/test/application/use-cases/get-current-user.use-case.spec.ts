import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { UserRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { GetCurrentUserUseCase } from '../../../src/application/use-cases/get-current-user.use-case';

describe('GetCurrentUserUseCase', () => {
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'findById'>>>;
  let useCase: GetCurrentUserUseCase;

  beforeEach(() => {
    userRepo = createMock<Pick<UserRepositoryPort, 'findById'>>(['findById']);
    useCase = new GetCurrentUserUseCase(userRepo as unknown as UserRepositoryPort);
  });

  it('returns the current user projection', async () => {
    userRepo.findById.mockResolvedValue({
      id: 'usr_1',
      email: 'a@b.com',
      firstName: 'Jane',
      lastName: 'Doe',
      userType: 'MEMBER',
      status: 'ACTIVE',
      emailVerified: false,
    } as never);

    const result = await useCase.execute('usr_1');

    expect(result.id).toBe('usr_1');
    expect(result.email).toBe('a@b.com');
    expect(userRepo.findById).toHaveBeenCalledWith(
      'usr_1',
      expect.objectContaining({ select: expect.arrayContaining(['id', 'email', 'userType']) }),
    );
  });

  it('throws when the user no longer exists', async () => {
    userRepo.findById.mockResolvedValue(null as never);

    await expect(useCase.execute('gone')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
