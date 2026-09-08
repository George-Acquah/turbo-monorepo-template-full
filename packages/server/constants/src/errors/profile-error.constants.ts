export const ProfileErrorCodes = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_ALREADY_EXISTS: 'PROFILE_ALREADY_EXISTS',
  PROFILE_UPDATE_FORBIDDEN: 'PROFILE_UPDATE_FORBIDDEN',
  PROFILE_AVATAR_INVALID: 'PROFILE_AVATAR_INVALID',
} as const;

export type ProfileErrorCode = (typeof ProfileErrorCodes)[keyof typeof ProfileErrorCodes];
