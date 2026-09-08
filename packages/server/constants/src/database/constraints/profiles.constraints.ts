import { enumConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import { TradingExperience, ConsentKind } from '../../profiles';

export const ProfilesConstraints = [
  enumConstraint({
    schema: Schemas.PROFILES,
    table: Tables.MEMBER_PROFILES,
    column: 'experience',
    values: TradingExperience,
  }),
  enumConstraint({
    schema: Schemas.PROFILES,
    table: Tables.CONSENT_RECORDS,
    column: 'kind',
    values: ConsentKind,
  }),
] as const;
