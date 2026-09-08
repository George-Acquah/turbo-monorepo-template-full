import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  type MemberProfilePersistence,
} from '@workspace/ports';
import { ProfileErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MemberProfilePersistence> {
    const profile = await this.memberProfileRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundAppException(
        ProfileErrorCodes.PROFILE_NOT_FOUND,
        'No member profile is linked to this account yet',
      );
    }
    return profile;
  }
}
