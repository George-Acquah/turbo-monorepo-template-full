import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  CONSENT_RECORD_REPOSITORY_TOKEN,
  type ConsentRecordRepositoryPort,
  type ConsentRecordPersistence,
} from '@workspace/ports';
import { ProfileErrorCodes } from '@workspace/constants';
import { NotFoundAppException } from '@workspace/utils';

@Injectable()
export class GetMyConsentsUseCase {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(CONSENT_RECORD_REPOSITORY_TOKEN)
    private readonly consentRepo: ConsentRecordRepositoryPort,
  ) {}

  async execute(userId: string): Promise<ConsentRecordPersistence[]> {
    const profile = await this.memberProfileRepo.findByUserId(userId, { select: ['id'] });
    if (!profile) {
      throw new NotFoundAppException(
        ProfileErrorCodes.PROFILE_NOT_FOUND,
        'No member profile is linked to this account yet',
      );
    }
    return this.consentRepo.findByProfile(profile.id);
  }
}
