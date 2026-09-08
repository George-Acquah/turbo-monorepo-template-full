import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  type ProfilesApplicationPort,
  type ProfileSummary,
  type ProfileContact,
  type FindOrCreateProfileByEmailInput,
  type EnsureProfileForUserInput,
  type ListActiveProfileBatchInput,
  type ListActiveProfileBatchResult,
  type RecordConsentInput,
  type DatabaseTx,
} from '@workspace/ports';
import { CreateGuestProfileUseCase } from '../member-profile/use-cases/create-guest-profile.use-case';
import { EnsureMemberProfileForUserUseCase } from '../member-profile/use-cases/ensure-member-profile-for-user.use-case';
import { RecordConsentForProfileUseCase } from '../consent/use-cases/record-consent-for-profile.use-case';

/**
 * Implements `ProfilesApplicationPort` — the sanctioned cross-context seam
 * other modules use instead of importing `ports/database/schema/profiles/**`
 * directly. Bound to `PROFILES_APPLICATION_TOKEN` in
 * `ProfilesApplicationPortModule`. Thin: both operations already exist as
 * real use-cases (`CreateGuestProfileUseCase` was built ahead of time
 * specifically for this), this just adapts them to the port's shape.
 *
 * "userId → profileId" resolution lives in `@workspace/profile-context`'s
 * `ProfileResolverService` instead (a `packages/server/*` package, exempt
 * from the module-boundary rule since it's not itself a `modules/*`
 * package) — not duplicated here.
 */
@Injectable()
export class ProfilesApplicationService implements ProfilesApplicationPort {
  constructor(
    private readonly createGuestProfileUseCase: CreateGuestProfileUseCase,
    private readonly ensureMemberProfileForUserUseCase: EnsureMemberProfileForUserUseCase,
    private readonly recordConsentForProfileUseCase: RecordConsentForProfileUseCase,
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
  ) {}

  async findOrCreateProfileByEmail(
    input: FindOrCreateProfileByEmailInput,
    tx?: DatabaseTx,
  ): Promise<ProfileSummary> {
    const profile = await this.createGuestProfileUseCase.execute(
      {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        country: input.country ?? null,
        experience: input.experience ?? null,
        goal: input.goal ?? null,
        source: input.source ?? null,
      },
      tx,
    );

    return { id: profile.id, email: profile.email, userId: profile.userId };
  }

  async ensureProfileForUser(
    input: EnsureProfileForUserInput,
    tx?: DatabaseTx,
  ): Promise<ProfileSummary> {
    const profile = await this.ensureMemberProfileForUserUseCase.execute(
      {
        userId: input.userId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
      },
      tx,
    );

    return { id: profile.id, email: profile.email, userId: profile.userId };
  }

  async listActiveProfileBatch(
    input: ListActiveProfileBatchInput,
  ): Promise<ListActiveProfileBatchResult> {
    const rows = await this.memberProfileRepo.listActive({
      afterId: input.afterId,
      limit: input.limit,
    });

    const nextAfterId = rows.length === input.limit ? rows[rows.length - 1]?.id : undefined;
    const items = rows
      .filter((row) => !input.excludeUserId || row.userId !== input.excludeUserId)
      .map((row) => ({ profileId: row.id, userId: row.userId }));

    return { items, nextAfterId };
  }

  async recordConsent(input: RecordConsentInput, tx?: DatabaseTx): Promise<void> {
    await this.recordConsentForProfileUseCase.execute(
      {
        profileId: input.profileId,
        kind: input.kind,
        version: input.version,
        granted: input.granted,
        ipAddress: input.ipAddress ?? null,
      },
      tx,
    );
  }

  async getProfileContact(profileId: string): Promise<ProfileContact | null> {
    const profile = await this.memberProfileRepo.findById(profileId, {
      select: ['email', 'phone', 'userId', 'firstName', 'lastName'],
    });
    if (!profile) return null;
    return {
      email: profile.email,
      phone: profile.phone ?? undefined,
      userId: profile.userId ?? undefined,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
    };
  }
}
